import { supabase } from './supabaseClient'

export const CANALI = ['Sito web', 'AutoScout24', 'Subito.it', 'Passaparola', 'In salone', 'Altro'] as const

export const PROVINCE_VENETO = ['VI', 'PD', 'VR', 'TV', 'VE', 'RO', 'BL']

export interface Vendita {
  id: string
  marca: string
  modello: string
  versione: string | null
  alimentazione: string
  carrozzeria: string | null
  immatricolazione_anno: number | null
  km: number
  prezzo: number
  prezzo_finale_vendita: number | null
  prezzo_acquisto: number | null
  costi_ripristino: number | null
  venduto_il: string | null
  created_at: string
  commerciale_id: string | null
  canale_vendita: string | null
  cliente_nome: string | null
  cliente_cognome: string | null
  cliente_citta: string | null
  cliente_provincia: string | null
  cliente_cellulare: string | null
  garanzia_aggiuntiva_mesi: number | null
  stato_pubblicazione: 'bozza' | 'pubblicato' | 'venduto'
}

export const CAMPI_VENDITA =
  'id, marca, modello, versione, alimentazione, carrozzeria, immatricolazione_anno, km, prezzo, prezzo_finale_vendita, prezzo_acquisto, costi_ripristino, venduto_il, created_at, commerciale_id, canale_vendita, cliente_nome, cliente_cognome, cliente_citta, cliente_provincia, cliente_cellulare, garanzia_aggiuntiva_mesi, stato_pubblicazione'

export async function caricaAuto(): Promise<Vendita[]> {
  const { data } = await supabase.from('annunci').select(CAMPI_VENDITA).order('venduto_il', { ascending: false })
  return ((data as Vendita[]) ?? []).map((v) => ({
    ...v,
    prezzo: Number(v.prezzo),
    prezzo_finale_vendita: v.prezzo_finale_vendita == null ? null : Number(v.prezzo_finale_vendita),
    prezzo_acquisto: v.prezzo_acquisto == null ? null : Number(v.prezzo_acquisto),
    costi_ripristino: v.costi_ripristino == null ? null : Number(v.costi_ripristino),
  }))
}

/** Prezzo effettivo di vendita (se non registrato, il prezzo di listino) */
export const incasso = (v: Vendita) => v.prezzo_finale_vendita ?? v.prezzo

/** Margine lordo: vendita - acquisto - ripristino. null se manca il prezzo di acquisto */
export const margine = (v: Vendita) =>
  v.prezzo_acquisto == null ? null : incasso(v) - v.prezzo_acquisto - (v.costi_ripristino ?? 0)

export const giorniTra = (da: string | Date, a: string | Date) =>
  Math.round((new Date(a).getTime() - new Date(da).getTime()) / 86400000)

export const giorniInStock = (v: Vendita) => giorniTra(v.created_at, v.venduto_il ?? new Date())

export const euro = (n: number, compatto = false) =>
  compatto && Math.abs(n) >= 10000
    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n)
    : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export const fasciaPrezzo = (p: number) =>
  p < 12000 ? 'Sotto 12k' : p < 18000 ? '12-18k' : p < 25000 ? '18-25k' : p < 32000 ? '25-32k' : 'Oltre 32k'
export const ORDINE_FASCE = ['Sotto 12k', '12-18k', '18-25k', '25-32k', 'Oltre 32k']

export const fasciaKm = (km: number) =>
  km < 30000 ? 'Sotto 30.000' : km < 60000 ? '30-60.000' : km < 100000 ? '60-100.000' : 'Oltre 100.000'
export const ORDINE_KM = ['Sotto 30.000', '30-60.000', '60-100.000', 'Oltre 100.000']

export interface Riga {
  chiave: string
  vendite: number
  fatturato: number
  margine: number
  margineNoto: number // n° vendite con margine calcolabile
}

/** Raggruppa le vendite per una chiave e calcola i totali */
export function raggruppa(vendite: Vendita[], chiave: (v: Vendita) => string | null | undefined): Riga[] {
  const m = new Map<string, Riga>()
  for (const v of vendite) {
    const k = chiave(v) || 'Non indicato'
    const r = m.get(k) ?? { chiave: k, vendite: 0, fatturato: 0, margine: 0, margineNoto: 0 }
    r.vendite++
    r.fatturato += incasso(v)
    const mg = margine(v)
    if (mg != null) {
      r.margine += mg
      r.margineNoto++
    }
    m.set(k, r)
  }
  return [...m.values()]
}

export const MESI_BREVI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

/** Ultimi n mesi (dal più vecchio), chiave "2026-03" */
export function ultimiMesi(n: number, oggi = new Date()) {
  const out: { chiave: string; etichetta: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1)
    out.push({
      chiave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      etichetta: `${MESI_BREVI[d.getMonth()]}${d.getMonth() === 0 || i === n - 1 ? ` ${String(d.getFullYear()).slice(2)}` : ''}`,
    })
  }
  return out
}
