import type { ClienteConfig } from './tipi'
import { telE164 } from './helpers'

export interface FaqSeo {
  question: string
  answer: string
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** JSON dentro <script>: evita che un "</script>" nei testi chiuda il tag */
const jsonLd = (obj: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}</script>`

/** JSON-LD AutoDealer (LocalBusiness) costruito dal config */
export function schemaDealer(c: ClienteConfig) {
  const url = `${c.sito.url}/`
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${url}#dealer`,
    name: c.azienda.ragioneSociale,
    alternateName: c.azienda.nome,
    description: c.sito.descrizioneHome,
    url,
    image: `${c.sito.url}${c.sito.ogImage}`,
    priceRange: c.sito.priceRange,
    ...(c.contatti.telefono && { telephone: telE164(c.contatti.telefono) }),
    ...(c.contatti.email && { email: c.contatti.email }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.showroom.via,
      addressLocality: c.showroom.citta,
      postalCode: c.showroom.cap,
      addressRegion: c.showroom.provincia,
      addressCountry: 'IT',
    },
    geo: { '@type': 'GeoCoordinates', latitude: c.showroom.lat, longitude: c.showroom.lng },
    areaServed: { '@type': 'State', name: c.showroom.regione },
    openingHoursSpecification: c.orari.flatMap((o) =>
      o.fasce.map(([opens, closes]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: o.giorni,
        opens,
        closes,
      }))
    ),
    sameAs: Object.values(c.social).filter(Boolean),
  }
}

export function schemaFaq(faq: FaqSeo[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

/** Tutto il blocco SEO dell'<head> del sito vetrina */
export function headSito(c: ClienteConfig, faq: FaqSeo[]) {
  const url = `${c.sito.url}/`
  const og = `${c.sito.url}${c.sito.ogImage}`
  const robots = c.demo ? 'noindex, nofollow' : 'index, follow'
  return [
    `<title>${esc(c.sito.titoloHome)}</title>`,
    `<meta name="title" content="${esc(c.sito.titoloHome)}" />`,
    `<meta name="description" content="${esc(c.sito.descrizioneHome)}" />`,
    `<meta name="keywords" content="${esc(c.sito.keywords.join(', '))}" />`,
    `<meta name="author" content="${esc(c.azienda.ragioneSociale)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(c.sito.titoloHome)}" />`,
    `<meta property="og:description" content="${esc(c.sito.descrizioneHome)}" />`,
    `<meta property="og:image" content="${og}" />`,
    `<meta property="og:image:width" content="${c.sito.ogImageWidth}" />`,
    `<meta property="og:image:height" content="${c.sito.ogImageHeight}" />`,
    `<meta property="og:locale" content="${c.sito.locale}" />`,
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:title" content="${esc(c.sito.titoloHome)}" />`,
    `<meta property="twitter:description" content="${esc(c.sito.descrizioneHome)}" />`,
    `<meta property="twitter:image" content="${og}" />`,
    `<meta name="geo.region" content="${c.showroom.geoRegion}" />`,
    `<meta name="geo.placename" content="${esc(c.showroom.citta)}" />`,
    `<meta name="geo.position" content="${c.showroom.lat};${c.showroom.lng}" />`,
    `<meta name="ICBM" content="${c.showroom.lat}, ${c.showroom.lng}" />`,
    // In demo niente dati strutturati: non vogliamo che un salone finto finisca su Google
    ...(c.demo ? [] : [jsonLd(schemaDealer(c)), ...(faq.length ? [jsonLd(schemaFaq(faq))] : [])]),
  ].join('\n    ')
}

/** robots.txt: in demo blocca tutto, altrimenti apre anche ai crawler AI (GEO/AEO) */
export function robotsTxt(c: ClienteConfig) {
  if (c.demo) return 'User-agent: *\nDisallow: /\n'
  const bot = [
    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'Perplexity-User',
    'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Google-Extended', 'Applebot',
    'Applebot-Extended', 'Bingbot', 'meta-externalagent',
  ]
  return [
    'User-agent: *\nAllow: /\n',
    '# Crawler AI permessi esplicitamente (Generative/Answer Engine Optimization)',
    ...bot.map((b) => `User-agent: ${b}\nAllow: /\n`),
    `Sitemap: ${c.sito.url}/sitemap.xml\n`,
  ].join('\n')
}

export function sitemapXml(c: ClienteConfig, pagine: { path: string; priority: string; changefreq: string }[], annunci: { id: string; updated_at?: string }[]) {
  const oggi = new Date().toISOString().split('T')[0]
  const url = (loc: string, lastmod: string, changefreq: string, priority: string) =>
    `  <url>\n    <loc>${c.sito.url}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  ...pagine.map((p) => url(p.path, oggi, p.changefreq, p.priority)),
  ...annunci.map((a) => url(`/parco-auto/${a.id}`, (a.updated_at || oggi).split('T')[0], 'weekly', '0.8')),
].join('\n')}
</urlset>
`
}
