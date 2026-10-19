import fs from 'node:fs'
import path from 'node:path'
import { loadEnv, type Plugin } from 'vite'
import { cliente } from './cliente.config'
import { headSito, robotsTxt, sitemapXml, type FaqSeo } from './seo-head'

const BRAND_DIR = path.resolve(__dirname, '../brand')

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

const VIRTUAL_LOGO_PDF = 'virtual:logo-pdf'

/** Larghezza/altezza di un PNG leggendo l'header IHDR */
function dimensioniPng(buf: Buffer) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

/**
 * Plugin condiviso da sito e gestionale:
 *  - inietta i colori del cliente come CSS variables (--brand, --brand-hover)
 *    così Tailwind (`bg-brand`, `text-brand/50`...) li usa senza ricompilare il CSS
 *  - serve la cartella /brand della radice come /brand/* (dev) e la copia nel build
 *  - espone `virtual:logo-pdf` (logo PNG in base64 per jsPDF)
 *  - sostituisce i segnaposto %CLIENTE_xxx% negli index.html
 *  - solo sito: <!--cliente:seo--> (meta, OG, JSON-LD), robots.txt e sitemap.xml nel build
 */
export interface OpzioniSito {
  /** FAQ per il JSON-LD FAQPage */
  faq: FaqSeo[]
  /** Pagine statiche per la sitemap */
  pagine: { path: string; priority: string; changefreq: string }[]
}

/** Solo per la sitemap: annunci pubblicati letti via REST Supabase al momento del build */
async function annunciPubblicati(env: Record<string, string>) {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const r = await fetch(`${url}/rest/v1/annunci?select=id,updated_at&stato_pubblicazione=eq.pubblicato`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return r.ok ? ((await r.json()) as { id: string; updated_at?: string }[]) : []
  } catch {
    return []
  }
}

/** PWA del gestionale: installabile su telefono e tablet con il nome e il colore del cliente */
function manifestGestionale() {
  return JSON.stringify({
    name: cliente.gestionale.titolo,
    short_name: cliente.azienda.nome,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0B0C0E',
    theme_color: cliente.brand.colori.primario,
    lang: cliente.sito.lingua,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  })
}

/** Service worker minimo: serve a rendere l'app installabile. Le chiamate ai dati non vengono mai messe in cache. */
const SERVICE_WORKER = `self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
`

export function clientePlugin(sito?: OpzioniSito): Plugin {
  let env: Record<string, string> = {}
  return {
    name: 'cliente-config',

    configResolved(config) {
      env = loadEnv(config.mode, config.root, 'VITE_')
    },

    // `import { LOGO_PDF, LOGO_PDF_ASPECT } from 'virtual:logo-pdf'`
    // -> logo PNG del cliente già in base64 (jsPDF lo vuole sincrono)
    resolveId(id) {
      if (id === VIRTUAL_LOGO_PDF) return '\0' + VIRTUAL_LOGO_PDF
    },
    load(id) {
      if (id !== '\0' + VIRTUAL_LOGO_PDF) return
      const file = path.join(BRAND_DIR, cliente.brand.logo.pdf)
      const buf = fs.readFileSync(file)
      const { w, h } = dimensioniPng(buf)
      return `export const LOGO_PDF = "data:image/png;base64,${buf.toString('base64')}";\nexport const LOGO_PDF_ASPECT = ${h / w};`
    },

    transformIndexHtml(html) {
      const { colori } = cliente.brand
      const vars = `<style id="cliente-brand">:root{--brand:${colori.primario};--brand-hover:${colori.primarioHover};}</style>`
      return html
        .replace(/%CLIENTE_NOME%/g, cliente.azienda.nome)
        .replace(/%CLIENTE_LINGUA%/g, cliente.sito.lingua)
        .replace(/%GESTIONALE_TITOLO%/g, cliente.gestionale.titolo)
        .replace('<!--cliente:seo-->', sito ? headSito(cliente, sito.faq) : '')
        .replace('</head>', `${sito ? '' : `    <link rel="manifest" href="/manifest.webmanifest" />\n    <meta name="theme-color" content="${colori.primario}" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-title" content="${cliente.azienda.nome}" />\n`}    ${vars}\n  </head>`)
    },

    configureServer(server) {
      if (!sito) server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json')
        res.end(manifestGestionale())
      })
      server.middlewares.use('/brand', (req, res, next) => {
        const file = path.join(BRAND_DIR, decodeURIComponent((req.url || '').split('?')[0]))
        if (!file.startsWith(BRAND_DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return next()
        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream')
        fs.createReadStream(file).pipe(res)
      })
    },

    async generateBundle() {
      if (!sito) {
        this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifestGestionale() })
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: SERVICE_WORKER })
      }
      if (sito) {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(cliente) })
        if (!cliente.demo) {
          const annunci = await annunciPubblicati(env)
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(cliente, sito.pagine, annunci) })
          this.warn(`sitemap: ${sito.pagine.length} pagine + ${annunci.length} annunci`)
        }
      }
      if (!fs.existsSync(BRAND_DIR)) return
      const copia = (dir: string) => {
        for (const nome of fs.readdirSync(dir)) {
          if (nome.startsWith('.')) continue
          const file = path.join(dir, nome)
          if (fs.statSync(file).isDirectory()) copia(file)
          else this.emitFile({ type: 'asset', fileName: `brand/${path.relative(BRAND_DIR, file).split(path.sep).join('/')}`, source: fs.readFileSync(file) })
        }
      }
      copia(BRAND_DIR)
    },
  }
}
