// Dati azienda usati nei documenti PDF, derivati da config/cliente.config.ts.
// Non scrivere dati qui: cambia il config.
import { cliente } from '@cliente/cliente.config'
import { capCitta } from '@cliente/helpers'

const { azienda, showroom, contatti } = cliente

export const AZIENDA = {
  ragioneSociale: azienda.ragioneSociale,
  claim: azienda.claim,

  // Sede operativa / showroom
  indirizzoShowroom: showroom.via,
  capCittaShowroom: capCitta(showroom),
  telefono: contatti.telefono ?? '',
  cellulare: contatti.cellulare ?? '',
  email: contatti.email ?? '',

  // Sede legale / dati fiscali
  indirizzoLegale: azienda.sedeLegale.via,
  capCittaLegale: capCitta(azienda.sedeLegale),
  piva: azienda.piva,
  registroImprese: azienda.registroImprese,
  rea: azienda.rea,
  capitaleSociale: azienda.capitaleSociale,
}

/** Riga contatti per l'intestazione PDF: "Tel. 0444 000000 • info@..." oppure '' se non ci sono */
export const rigaContattiPdf = () =>
  [AZIENDA.telefono && `Tel. ${AZIENDA.telefono}`, AZIENDA.email].filter(Boolean).join(' • ')

/** Colore primario del cliente in RGB per jsPDF */
export { hexToRgb } from '@cliente/helpers'
export const COLORE_PRIMARIO = cliente.brand.colori.primario
