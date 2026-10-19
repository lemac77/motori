import type { ClienteConfig, Indirizzo, FasciaOraria } from './tipi'

/** "36100 Vicenza (VI)" */
export const capCitta = (i: Indirizzo) => `${i.cap} ${i.citta} (${i.provincia})`

/** "Via dei Motori 12, 36100 Vicenza (VI)" */
export const indirizzoCompleto = (i: Indirizzo) => `${i.via}, ${capCitta(i)}`

/** "0444 000000" -> "tel:+390444000000" */
export const telHref = (numero: string) => `tel:+39${numero.replace(/\D/g, '')}`

/** "0444 000000" -> "+390444000000" (schema.org) */
export const telE164 = (numero: string) => `+39${numero.replace(/\D/g, '')}`

export const whatsappHref = (c: ClienteConfig, testo?: string) =>
  c.contatti.whatsapp
    ? `https://wa.me/${c.contatti.whatsapp}${testo ? `?text=${encodeURIComponent(testo)}` : ''}`
    : undefined

/** "09:00 - 12:30 | 15:00 - 19:00", oppure "Chiuso" */
export const fasceTesto = (f: FasciaOraria) =>
  f.fasce.length ? f.fasce.map(([a, c]) => `${a} - ${c}`).join(' | ') : 'Chiuso'

export const mappaLink = (c: ClienteConfig) =>
  `https://maps.google.com/?q=${encodeURIComponent(c.showroom.queryMappa)}`

export const mappaEmbed = (c: ClienteConfig) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(c.showroom.queryMappa)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

/** "#e8612c" -> [232, 97, 44] (per jsPDF) */
export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
