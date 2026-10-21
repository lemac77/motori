import { cliente } from '@cliente/cliente.config'

interface DatiAuto {
  marca: string
  modello: string
  versione?: string
  condizione?: string
  immatricolazione_mese?: string | number
  immatricolazione_anno?: string | number
  km?: string | number
  alimentazione?: string
  cambio?: string
  colore?: string
  carrozzeria?: string
  cv?: string | number
  cilindrata_cc?: string | number
  porte?: string
  posti?: string | number
  classe_emissioni?: string
}

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const n = (v: unknown) => (v == null || v === '' ? null : Number(v))
const it = (v: number) => v.toLocaleString('it-IT')

/**
 * Descrizione annuncio costruita dai dati inseriti (nessun servizio esterno):
 * un testo ordinato e pronto da rifinire, non un elenco di campi.
 */
export function generaDescrizione(a: DatiAuto, accessori: string[] = []): string {
  const nome = [a.marca, a.modello, a.versione].filter(Boolean).join(' ')
  const anno = n(a.immatricolazione_anno)
  const mese = n(a.immatricolazione_mese)
  const km = n(a.km)
  const cv = n(a.cv)
  const cc = n(a.cilindrata_cc)

  const righe: string[] = []

  // Apertura
  const cond = a.condizione === 'Nuovo' ? 'nuova' : a.condizione === 'Km0' ? 'a chilometri zero' : 'usata'
  let apertura = `${nome}, ${cond}`
  if (anno) apertura += `, immatricolata ${mese && mese >= 1 && mese <= 12 ? `a ${MESI[mese - 1]} ` : 'nel '}${anno}`
  if (km != null && a.condizione !== 'Nuovo') apertura += `, con ${it(km)} km`
  righe.push(apertura + '.')

  // Tecnica
  const tec: string[] = []
  if (a.alimentazione) tec.push(`alimentazione ${a.alimentazione.toLowerCase()}`)
  if (cc) tec.push(`${it(cc)} cc`)
  if (cv) tec.push(`${cv} CV`)
  if (a.cambio) tec.push(`cambio ${a.cambio.toLowerCase()}`)
  if (a.classe_emissioni) tec.push(a.classe_emissioni)
  if (tec.length) righe.push(`Scheda tecnica: ${tec.join(', ')}.`)

  const est: string[] = []
  if (a.carrozzeria) est.push(`carrozzeria ${a.carrozzeria.toLowerCase()}`)
  if (a.colore) est.push(`colore ${a.colore.toLowerCase()}`)
  if (a.porte) est.push(`${a.porte} porte`)
  const posti = n(a.posti)
  if (posti) est.push(`${posti} posti`)
  if (est.length) righe.push(`Esterni e abitabilità: ${est.join(', ')}.`)

  // Dotazioni: le più rilevanti per prime, senza elencarne 40
  if (accessori.length) {
    const priorita = ['Navigatore', 'Apple CarPlay', 'Android Auto', 'Climatizzatore', 'Cruise', 'Sensori di parcheggio', 'Telecamera', 'Fari', 'Cerchi in lega', 'Interni in pelle', 'Sedili riscaldati', 'Tetto', 'Bluetooth', 'Isofix']
    const ordinati = [...accessori].sort((x, y) => {
      const px = priorita.findIndex((p) => x.includes(p))
      const py = priorita.findIndex((p) => y.includes(p))
      return (px < 0 ? 99 : px) - (py < 0 ? 99 : py)
    })
    const top = ordinati.slice(0, 8)
    righe.push(`Tra le dotazioni: ${top.join(', ').toLowerCase()}${accessori.length > top.length ? ` e altre ${accessori.length - top.length}` : ''}.`)
  }

  // Chiusura dal config del cliente
  const { azienda, showroom, offerta } = cliente
  const chiusura = [`Garanzia ${offerta.garanziaMesi} mesi inclusa`]
  if (offerta.rateMax) chiusura.push(`finanziamenti da ${offerta.rateMin} a ${offerta.rateMax} rate`)
  chiusura.push('valutazione della tua auto in permuta')
  righe.push(`${chiusura.join(', ')}.`)
  righe.push(`Vieni a vederla da ${azienda.nome} a ${showroom.citta}: puoi prenotare un test drive quando vuoi.`)

  return righe.join('\n\n')
}
