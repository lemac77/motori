// Import relativi (non alias @cliente): questo file è letto anche da vite.config.ts tramite data.ts
// Scorciatoie per i testi del sito: tutto viene da config/cliente.config.ts.
// I contatti possono essere undefined: i componenti nascondono i relativi blocchi.
import { cliente } from '../../../config/cliente.config'
import { capCitta, fasceTesto, telHref, whatsappHref, mappaLink, mappaEmbed } from '../../../config/helpers'

const { azienda, showroom, contatti } = cliente

export const DEMO = cliente.demo
export const NOME = azienda.nome
export const RAGIONE = azienda.ragioneSociale
export const CITTA = showroom.citta
export const REGIONE = showroom.regione
export const INDIRIZZO = showroom.via
export const CAP_CITTA = capCitta(showroom)
export const SEDE_LEGALE = `${azienda.sedeLegale.via}, ${capCitta(azienda.sedeLegale)}`
export const SITO_HOST = new URL(cliente.sito.url).host

export const TEL = contatti.telefono
export const TEL_HREF = TEL ? telHref(TEL) : undefined
export const CELL = contatti.cellulare
export const CELL_HREF = CELL ? telHref(CELL) : undefined
export const EMAIL = contatti.email
export const WA_HREF = whatsappHref(cliente)
export const waLink = (testo: string) => whatsappHref(cliente, testo)
export const HA_CONTATTI = Boolean(TEL || CELL || EMAIL || WA_HREF)

export const MAPPA_LINK = mappaLink(cliente)
export const MAPPA_EMBED = mappaEmbed(cliente)
export const DATI_LEGALI = azienda

export const ORARI = cliente.orari
export { fasceTesto }
