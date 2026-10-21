// Lettura e scrittura CSV senza librerie esterne.
// Gestisce BOM, separatore ; , o tab (rilevato da solo), virgolette e a capo nei campi.

export function parseCsv(testo: string): string[][] {
  const t = testo.replace(/^﻿/, '')
  const prima = t.split(/\r?\n/, 1)[0] ?? ''
  const cont = (c: string) => prima.split(c).length - 1
  const sep = [';', '\t', ','].sort((a, b) => cont(b) - cont(a))[0]

  const righe: string[][] = []
  let riga: string[] = []
  let campo = ''
  let tra = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (tra) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          campo += '"'
          i++
        } else tra = false
      } else campo += c
    } else if (c === '"') tra = true
    else if (c === sep) {
      riga.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      riga.push(campo)
      campo = ''
      if (riga.some((x) => x.trim() !== '')) righe.push(riga)
      riga = []
    } else campo += c
  }
  riga.push(campo)
  if (riga.some((x) => x.trim() !== '')) righe.push(riga)
  return righe
}

export function toCsv(righe: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    let s = v == null ? '' : String(v)
    // Excel esegue come formula le celle che iniziano con = + - @ (o tab/a capo): un'auto con
    // marca "=CMD(...)" diventerebbe un attacco all'apertura del file. L'apice la rende testo.
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM + separatore ; : Excel italiano lo apre senza rovinare accenti e colonne
  return '﻿' + righe.map((r) => r.map(esc).join(';')).join('\r\n')
}

export function scaricaCsv(nomeFile: string, righe: (string | number | null | undefined)[][]) {
  const blob = new Blob([toCsv(righe)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Campi importabili degli annunci
// ---------------------------------------------------------------------------

export type CampoId =
  | 'marca' | 'modello' | 'versione' | 'prezzo' | 'condizione' | 'immatricolazione'
  | 'km' | 'alimentazione' | 'cambio' | 'colore' | 'targa' | 'numero_telaio'
  | 'carrozzeria' | 'porte' | 'posti' | 'classe_emissioni' | 'cv' | 'cilindrata_cc'
  | 'prezzo_acquisto' | 'costi_ripristino' | 'descrizione'

export interface CampoDef {
  id: CampoId
  etichetta: string
  obbligatorio?: boolean
  /** sinonimi per riconoscere la colonna dall'intestazione */
  alias: string[]
  esempio: string
}

export const CAMPI: CampoDef[] = [
  { id: 'marca', etichetta: 'Marca', obbligatorio: true, alias: ['marca', 'brand', 'costruttore', 'make'], esempio: 'Fiat' },
  { id: 'modello', etichetta: 'Modello', obbligatorio: true, alias: ['modello', 'model'], esempio: '500' },
  { id: 'versione', etichetta: 'Versione', alias: ['versione', 'allestimento', 'trim', 'serie'], esempio: '1.2 Lounge' },
  { id: 'prezzo', etichetta: 'Prezzo', obbligatorio: true, alias: ['prezzo', 'prezzo vendita', 'prezzo di vendita', 'price', 'importo', 'listino'], esempio: '9900' },
  { id: 'condizione', etichetta: 'Condizione', alias: ['condizione', 'stato veicolo', 'usato nuovo', 'tipo'], esempio: 'Usato' },
  { id: 'immatricolazione', etichetta: 'Immatricolazione (mm/aaaa)', alias: ['immatricolazione', 'prima immatricolazione', 'anno', 'anno immatricolazione', 'data immatricolazione', 'year'], esempio: '03/2019' },
  { id: 'km', etichetta: 'Km', alias: ['km', 'chilometri', 'chilometraggio', 'kilometri', 'mileage'], esempio: '64000' },
  { id: 'alimentazione', etichetta: 'Alimentazione', alias: ['alimentazione', 'carburante', 'combustibile', 'fuel'], esempio: 'Benzina' },
  { id: 'cambio', etichetta: 'Cambio', alias: ['cambio', 'trasmissione', 'gearbox'], esempio: 'Manuale' },
  { id: 'colore', etichetta: 'Colore', alias: ['colore', 'colour', 'color'], esempio: 'Bianco' },
  { id: 'targa', etichetta: 'Targa', alias: ['targa', 'plate'], esempio: 'AB123CD' },
  { id: 'numero_telaio', etichetta: 'Telaio', alias: ['telaio', 'numero telaio', 'vin'], esempio: 'ZFA31200000123456' },
  { id: 'carrozzeria', etichetta: 'Carrozzeria', alias: ['carrozzeria', 'tipo carrozzeria', 'body'], esempio: 'Berlina' },
  { id: 'porte', etichetta: 'Porte', alias: ['porte', 'numero porte', 'doors'], esempio: '3' },
  { id: 'posti', etichetta: 'Posti', alias: ['posti', 'numero posti', 'seats'], esempio: '4' },
  { id: 'classe_emissioni', etichetta: 'Classe emissioni', alias: ['classe emissioni', 'emissioni', 'euro', 'classe euro'], esempio: 'Euro 6' },
  { id: 'cv', etichetta: 'CV', alias: ['cv', 'potenza', 'potenza cv', 'hp'], esempio: '69' },
  { id: 'cilindrata_cc', etichetta: 'Cilindrata (cc)', alias: ['cilindrata', 'cilindrata cc', 'cc'], esempio: '1242' },
  { id: 'prezzo_acquisto', etichetta: 'Prezzo di acquisto', alias: ['prezzo acquisto', 'prezzo di acquisto', 'acquisto', 'costo acquisto', 'costo'], esempio: '7800' },
  { id: 'costi_ripristino', etichetta: 'Costi di ripristino', alias: ['ripristino', 'costi ripristino', 'costi di ripristino', 'spese ripristino'], esempio: '300' },
  { id: 'descrizione', etichetta: 'Descrizione', alias: ['descrizione', 'note', 'description'], esempio: 'Unico proprietario, tagliandi certificati' },
]

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/** Per ogni campo, l'indice della colonna che sembra corrispondere (o -1) */
export function indovinaMappa(intestazioni: string[]): Record<CampoId, number> {
  const h = intestazioni.map(norm)
  const mappa = {} as Record<CampoId, number>
  const usate = new Set<number>()
  for (const c of CAMPI) {
    let idx = h.findIndex((x, i) => !usate.has(i) && c.alias.some((a) => norm(a) === x))
    if (idx < 0) idx = h.findIndex((x, i) => !usate.has(i) && c.alias.some((a) => x.includes(norm(a)) && norm(a).length > 3))
    if (idx >= 0) usate.add(idx)
    mappa[c.id] = idx
  }
  return mappa
}

const numero = (v: string): number | null => {
  let s = v.replace(/[€\s]/g, '').replace(/[^\d.,-]/g, '')
  if (!s) return null
  // 12.500,00 oppure 12,500.00 oppure 12.500 (migliaia) oppure 12500.5
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (s.includes(',')) s = s.replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const intero = (v: string) => {
  const n = numero(v)
  return n == null ? null : Math.round(n)
}

const ALIMENTAZIONI: [RegExp, string][] = [
  [/^(benz|gasolina|petrol)/, 'Benzina'],
  [/^(diesel|gasolio)/, 'Diesel'],
  [/gpl|lpg/, 'GPL'],
  [/metano|cng/, 'Metano'],
  [/elettric|electric|\bev\b/, 'Elettrica'],
  [/ibrid|hybrid|mild/, 'Ibrida'],
]

export interface RigaPronta {
  riga: number
  dati: Record<string, string | number | null>
  errori: string[]
  avvisi: string[]
}

/** Converte una riga grezza nel formato della tabella annunci, con errori e avvisi */
export function preparaRiga(valori: string[], mappa: Record<CampoId, number>, numeroRiga: number): RigaPronta {
  const g = (id: CampoId) => (mappa[id] >= 0 ? (valori[mappa[id]] ?? '').trim() : '')
  const errori: string[] = []
  const avvisi: string[] = []
  const dati: Record<string, string | number | null> = {}

  dati.marca = g('marca')
  dati.modello = g('modello')
  if (!dati.marca) errori.push('Marca mancante')
  if (!dati.modello) errori.push('Modello mancante')

  const prezzo = numero(g('prezzo'))
  if (prezzo == null || prezzo <= 0) errori.push('Prezzo mancante o non valido')
  dati.prezzo = prezzo ?? 0

  dati.versione = g('versione') || null

  const cond = norm(g('condizione'))
  dati.condizione = /nuov/.test(cond) && !/km/.test(cond) ? 'Nuovo' : /km ?0|km zero|kmzero/.test(cond) ? 'Km0' : 'Usato'

  const imm = g('immatricolazione')
  dati.immatricolazione_mese = null
  dati.immatricolazione_anno = null
  if (imm) {
    const m = imm.match(/(?:(\d{1,2})[\/.\- ])?(?:\d{1,2}[\/.\- ])?((?:19|20)\d{2})/)
    if (m) {
      dati.immatricolazione_anno = Number(m[2])
      if (m[1] && Number(m[1]) >= 1 && Number(m[1]) <= 12) dati.immatricolazione_mese = Number(m[1])
    } else avvisi.push('Immatricolazione non riconosciuta, lasciata vuota')
  }

  dati.km = intero(g('km')) ?? 0
  if (!g('km') && dati.condizione === 'Usato') avvisi.push('Km non indicati')

  const al = norm(g('alimentazione'))
  const trovata = ALIMENTAZIONI.find(([re]) => re.test(al))
  dati.alimentazione = trovata ? trovata[1] : 'Benzina'
  if (!trovata) avvisi.push(al ? `Alimentazione "${g('alimentazione')}" non riconosciuta: impostata Benzina` : 'Alimentazione mancante: impostata Benzina')

  const cb = norm(g('cambio'))
  dati.cambio = /auto|dsg|robot|cvt|tiptronic|sequenz/.test(cb) ? 'Automatico' : 'Manuale'
  if (!cb) avvisi.push('Cambio mancante: impostato Manuale')

  dati.colore = g('colore') || null
  dati.targa = g('targa').toUpperCase().replace(/\s/g, '') || null
  dati.numero_telaio = g('numero_telaio').toUpperCase().replace(/\s/g, '') || null
  dati.carrozzeria = g('carrozzeria') || null
  dati.porte = g('porte') || null
  dati.posti = intero(g('posti'))
  dati.classe_emissioni = g('classe_emissioni') || null
  dati.cv = intero(g('cv'))
  dati.cilindrata_cc = intero(g('cilindrata_cc'))
  dati.prezzo_acquisto = numero(g('prezzo_acquisto'))
  dati.costi_ripristino = numero(g('costi_ripristino'))
  dati.descrizione = g('descrizione') || null

  return { riga: numeroRiga, dati, errori, avvisi }
}

export function templateCsv(): string[][] {
  return [CAMPI.map((c) => c.etichetta), CAMPI.map((c) => c.esempio)]
}
