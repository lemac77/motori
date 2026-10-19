import { cliente } from '@cliente/cliente.config'

const BASE_URL = cliente.sito.url

interface SeoMeta {
  title: string
  description: string
  path: string
}

/**
 * Aggiorna title/description/canonical/OG a runtime in base alla pagina corrente.
 * Necessario perché il sito è una SPA con un solo index.html: senza questo, Google
 * e i crawler che eseguono JS vedrebbero lo stesso title/description su ogni pagina
 * (home, azienda, faq, singola auto, ecc), il che è penalizzante per la SEO.
 * I crawler che NON eseguono JS (molti bot AI) continuano a vedere solo i meta
 * statici dell'index.html: per quelli conta soprattutto il JSON-LD e i meta di base.
 */
export function setPageMeta({ title, description, path }: SeoMeta) {
  document.title = title

  const setMeta = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute(attr, value)
  }

  setMeta('meta[name="description"]', 'content', description)
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', description)
  setMeta('meta[property="og:url"]', 'content', `${BASE_URL}${path}`)
  setMeta('meta[property="twitter:title"]', 'content', title)
  setMeta('meta[property="twitter:description"]', 'content', description)
  setMeta('link[rel="canonical"]', 'href', `${BASE_URL}${path}`)
}
