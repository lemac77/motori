import { cliente } from '@cliente/cliente.config'

/**
 * GA4 / GTM caricati SOLO se:
 *  - gli ID sono compilati in config/cliente.config.ts
 *  - non siamo in modalità demo
 *  - il visitatore ha accettato i cookie analitici
 * Prima di questo, nessuno script Google viene scaricato.
 */
const { ga4Id, gtmId } = cliente.integrazioni
export const trackingConfigurato = !cliente.demo && Boolean(ga4Id || gtmId)

export const COOKIE_CONSENT_KEY = 'cookie-consent'
export type SceltaCookie = 'accepted' | 'rejected'

export function leggiConsenso(): SceltaCookie | null {
  try {
    const v = localStorage.getItem(COOKIE_CONSENT_KEY)
    return v === 'accepted' || v === 'rejected' ? v : null
  } catch {
    return null
  }
}

export function salvaConsenso(scelta: SceltaCookie) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, scelta)
  } catch {
    /* storage bloccato: pazienza, il banner ricomparirà */
  }
}

let caricato = false
type W = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }

function aggiungiScript(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

/** Carica gli script di tracking. `inviaPaginaCorrente` = true se il consenso arriva a sessione iniziata. */
export function caricaTracking(inviaPaginaCorrente = false) {
  if (caricato || !trackingConfigurato) return
  caricato = true
  const w = window as W
  w.dataLayer = w.dataLayer || []

  if (gtmId) {
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    aggiungiScript(`https://www.googletagmanager.com/gtm.js?id=${gtmId}`)
  }
  if (ga4Id) {
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments)
    }
    w.gtag('js', new Date())
    // page_view gestiti a mano da tracciaPagina() (è una SPA)
    w.gtag('config', ga4Id, { send_page_view: false })
    aggiungiScript(`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`)
  }
  if (inviaPaginaCorrente) tracciaPagina(window.location.pathname)
}

/** Da chiamare a ogni cambio pagina, DOPO aver aggiornato il title */
export function tracciaPagina(path: string) {
  if (!caricato) return
  const w = window as W
  const dati = { page_path: path, page_location: window.location.href, page_title: document.title }
  if (w.gtag) w.gtag('event', 'page_view', dati)
  if (gtmId) w.dataLayer?.push({ event: 'page_view', ...dati })
}
