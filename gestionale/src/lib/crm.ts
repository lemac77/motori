export type Stadio = 'nuovo' | 'contattato' | 'test_drive' | 'preventivo' | 'trattativa' | 'venduto' | 'perso'

export const STADI: { v: Stadio; l: string; punto: string }[] = [
  { v: 'nuovo', l: 'Nuovo', punto: 'bg-brand' },
  { v: 'contattato', l: 'Contattato', punto: 'bg-sky-500' },
  { v: 'test_drive', l: 'Test drive', punto: 'bg-violet-500' },
  { v: 'preventivo', l: 'Preventivo', punto: 'bg-amber-500' },
  { v: 'trattativa', l: 'Trattativa', punto: 'bg-orange-500' },
  { v: 'venduto', l: 'Venduto', punto: 'bg-emerald-500' },
  { v: 'perso', l: 'Perso', punto: 'bg-neutral-400' },
]

export const FONTI = ['Sito web', 'Telefono', 'In salone', 'AutoScout24', 'Subito.it', 'Passaparola', 'Altro']

export const TIPI_ATTIVITA = [
  { v: 'nota', l: 'Nota' },
  { v: 'chiamata', l: 'Chiamata' },
  { v: 'email', l: 'Email' },
  { v: 'visita', l: 'Visita' },
] as const

export interface Trattativa {
  id: string
  nome: string
  telefono: string | null
  email: string | null
  auto_interesse: string | null
  fonte: string
  stato: Stadio
  valore: number | null
  commerciale_id: string | null
  prossima_azione: string | null
  richiamo_il: string | null
  motivo_perso: string | null
  richiesta_id: string | null
  creato_il: string
  aggiornato_il: string
  chiuso_il: string | null
}

export interface Attivita {
  id: string
  trattativa_id: string
  tipo: 'nota' | 'chiamata' | 'email' | 'visita' | 'stadio'
  testo: string
  autore: string | null
  creato_il: string
}

export const aperta = (s: Stadio) => s !== 'venduto' && s !== 'perso'
export const etichettaStadio = (s: Stadio) => STADI.find((x) => x.v === s)?.l ?? s

const isoLocale = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const oggiISO = () => isoLocale(new Date())
export const traGiorni = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return isoLocale(d)
}

/** Giorni da oggi: negativo = in ritardo */
export function giorniA(dataISO: string) {
  const a = new Date(dataISO + 'T00:00:00')
  const b = new Date()
  b.setHours(0, 0, 0, 0)
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

export function infoRichiamo(dataISO: string | null) {
  if (!dataISO) return null
  const g = giorniA(dataISO)
  if (g < 0) return { testo: `In ritardo di ${-g} ${g === -1 ? 'giorno' : 'giorni'}`, tono: 'rosso' as const }
  if (g === 0) return { testo: 'Da richiamare oggi', tono: 'arancio' as const }
  if (g === 1) return { testo: 'Domani', tono: 'neutro' as const }
  return { testo: `Tra ${g} giorni`, tono: 'neutro' as const }
}

export const euro = (n: number | null | undefined) =>
  n == null ? '' : n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function fa(data: string) {
  const min = Math.round((Date.now() - new Date(data).getTime()) / 60000)
  if (min < 60) return `${Math.max(min, 1)} min fa`
  const ore = Math.round(min / 60)
  if (ore < 24) return `${ore} ${ore === 1 ? 'ora' : 'ore'} fa`
  const gg = Math.round(ore / 24)
  return gg === 1 ? 'ieri' : `${gg} giorni fa`
}
