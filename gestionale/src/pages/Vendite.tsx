import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, AlertTriangle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Pannello, StatTile, BarreOrizzontali, ColonneMensili, Pillole, RigaBarra } from '../components/Grafici'
import { useUtente, nomeCompleto } from '../lib/utente'
import {
  caricaAuto, Vendita, incasso, margine, giorniInStock, giorniTra, euro, raggruppa, Riga,
  fasciaPrezzo, ORDINE_FASCE, fasciaKm, ORDINE_KM, ultimiMesi,
} from '../lib/vendite'

type Periodo = '30' | '90' | '365' | 'anno'
type Metrica = 'vendite' | 'fatturato' | 'margine'
type Dimensione = 'marca' | 'modello' | 'alimentazione' | 'carrozzeria' | 'fascia' | 'km'

const DIMENSIONI: { v: Dimensione; l: string }[] = [
  { v: 'marca', l: 'Marca' },
  { v: 'modello', l: 'Modello' },
  { v: 'alimentazione', l: 'Alimentazione' },
  { v: 'carrozzeria', l: 'Carrozzeria' },
  { v: 'fascia', l: 'Prezzo' },
  { v: 'km', l: 'Km' },
]

const SOGLIA_STOCK_FERMO = 90

export function Vendite() {
  const { isTitolare, commercialeAttivo, commerciali } = useUtente()
  const [auto, setAuto] = useState<Vendita[] | null>(null)
  const [periodo, setPeriodo] = useState<Periodo>('365')
  const [filtroComm, setFiltroComm] = useState('')
  const [metrica, setMetrica] = useState<Metrica>('vendite')
  const [dim, setDim] = useState<Dimensione>('marca')

  useEffect(() => {
    caricaAuto().then(setAuto)
  }, [])

  // Il commerciale vede solo le sue vendite; il titolare può filtrare
  const commId = commercialeAttivo?.id ?? filtroComm
  const metricaEff: Metrica = !isTitolare && metrica === 'margine' ? 'vendite' : metrica

  const { vendute, stock, nelPeriodo } = useMemo(() => {
    const oggi = new Date()
    const inizio =
      periodo === 'anno' ? new Date(oggi.getFullYear(), 0, 1) : new Date(oggi.getTime() - Number(periodo) * 86400000)
    const vendute = (auto ?? []).filter((a) => a.stato_pubblicazione === 'venduto' && a.venduto_il && (!commId || a.commerciale_id === commId))
    return {
      vendute,
      stock: (auto ?? []).filter((a) => a.stato_pubblicazione !== 'venduto'),
      nelPeriodo: vendute.filter((v) => new Date(v.venduto_il!) >= inizio),
    }
  }, [auto, periodo, commId])

  const valore = (r: Riga) => (metricaEff === 'vendite' ? r.vendite : metricaEff === 'fatturato' ? r.fatturato : r.margine)
  const testo = (r: Riga) => (metricaEff === 'vendite' ? String(r.vendite) : euro(valore(r), true))
  const dettagli = (r: Riga, totale: number) => [
    `${r.vendite} ${r.vendite === 1 ? 'auto' : 'auto'} · ${Math.round((r.vendite / Math.max(totale, 1)) * 100)}% del totale`,
    `Fatturato ${euro(r.fatturato)}`,
    ...(isTitolare && r.margineNoto ? [`Margine ${euro(r.margine)} · medio ${euro(r.margine / r.margineNoto)}`] : []),
  ]
  const toBarre = (righe: Riga[], ordine?: string[]): RigaBarra[] =>
    (ordine
      ? ordine.map((o) => righe.find((r) => r.chiave === o)).filter((r): r is Riga => !!r)
      : [...righe].sort((a, b) => valore(b) - valore(a))
    ).map((r) => ({ etichetta: r.chiave, valore: valore(r), testo: testo(r), dettagli: dettagli(r, nelPeriodo.length) }))

  if (!auto) {
    return (
      <Layout>
        <p className="text-sm text-neutral-500">Caricamento...</p>
      </Layout>
    )
  }

  // ---- KPI ----
  const fatturato = nelPeriodo.reduce((s, v) => s + incasso(v), 0)
  const conMargine = nelPeriodo.filter((v) => margine(v) != null)
  const margineTot = conMargine.reduce((s, v) => s + margine(v)!, 0)
  const giorniMedi = nelPeriodo.length ? Math.round(nelPeriodo.reduce((s, v) => s + giorniInStock(v), 0) / nelPeriodo.length) : 0
  const fermi = stock
    .map((a) => ({ ...a, giorni: giorniTra(a.created_at, new Date()) }))
    .sort((a, b) => b.giorni - a.giorni)
  const fermiOltre = fermi.filter((a) => a.giorni >= SOGLIA_STOCK_FERMO)
  const valoreStock = stock.reduce((s, a) => s + a.prezzo, 0)

  // ---- andamento 12 mesi ----
  const mesi = ultimiMesi(12)
  const perMese = raggruppa(vendute, (v) => v.venduto_il!.slice(0, 7))
  const colonne = mesi.map((m) => {
    const r = perMese.find((x) => x.chiave === m.chiave) ?? { chiave: m.chiave, vendite: 0, fatturato: 0, margine: 0, margineNoto: 0 }
    return {
      etichetta: m.etichetta,
      valore: valore(r),
      dettagli: [
        `${r.vendite} auto vendute`,
        `Fatturato ${euro(r.fatturato)}`,
        ...(isTitolare && r.margineNoto ? [`Margine ${euro(r.margine)}`] : []),
      ],
    }
  })

  // ---- cosa si vende ----
  const chiaveDim = (v: Vendita) =>
    dim === 'marca' ? v.marca
      : dim === 'modello' ? `${v.marca} ${v.modello}`
      : dim === 'alimentazione' ? v.alimentazione
      : dim === 'carrozzeria' ? v.carrozzeria
      : dim === 'fascia' ? fasciaPrezzo(incasso(v))
      : fasciaKm(v.km)
  const perDim = raggruppa(nelPeriodo, chiaveDim)
  const ordinato = dim === 'fascia' ? ORDINE_FASCE : dim === 'km' ? ORDINE_KM : undefined
  const barreDim = toBarre(perDim, ordinato)
  const mostraCoda = !ordinato && barreDim.length > 8
  const coda = mostraCoda ? [...perDim].sort((a, b) => valore(a) - valore(b)).slice(0, 3) : []

  // ---- commerciali, zone, canali ----
  const perComm = raggruppa(nelPeriodo, (v) => nomeCompleto(commerciali.find((c) => c.id === v.commerciale_id)) || 'Non assegnato')
  const NOMI_PROV: Record<string, string> = { VI: 'Vicenza', PD: 'Padova', VR: 'Verona', TV: 'Treviso', VE: 'Venezia', RO: 'Rovigo', BL: 'Belluno' }
  const perProv = raggruppa(nelPeriodo, (v) => (v.cliente_provincia ? NOMI_PROV[v.cliente_provincia] ?? v.cliente_provincia : null))
  // scheda commerciali: giorni medi di vendita per persona
  const giorniComm = (nome: string) => {
    const vs = nelPeriodo.filter((v) => (nomeCompleto(commerciali.find((c) => c.id === v.commerciale_id)) || 'Non assegnato') === nome)
    return vs.length ? Math.round(vs.reduce((t, v) => t + giorniInStock(v), 0) / vs.length) : 0
  }
  const perCitta = raggruppa(nelPeriodo, (v) => (v.cliente_citta ? `${v.cliente_citta}${v.cliente_provincia ? ` (${v.cliente_provincia})` : ''}` : null))
  const perCanale = raggruppa(nelPeriodo, (v) => v.canale_vendita)

  const etichettaPeriodo = { '30': 'ultimi 30 giorni', '90': 'ultimi 90 giorni', '365': 'ultimi 12 mesi', anno: `anno ${new Date().getFullYear()}` }[periodo]
  const metriche: { v: Metrica; l: string }[] = [
    { v: 'vendite', l: 'N. auto' },
    { v: 'fatturato', l: 'Fatturato' },
    ...(isTitolare ? [{ v: 'margine' as Metrica, l: 'Margine' }] : []),
  ]

  return (
    <Layout largo>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <BarChart3 className="h-6 w-6 text-brand" />
            Vendite
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {commercialeAttivo ? `Le vendite di ${nomeCompleto(commercialeAttivo)}` : 'Tutto il salone'} · {etichettaPeriodo}
          </p>
        </div>
      </div>

      {/* Filtri: una riga sopra i grafici */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <Pillole
          valori={[{ v: '30', l: '30 gg' }, { v: '90', l: '90 gg' }, { v: '365', l: '12 mesi' }, { v: 'anno', l: 'Anno in corso' }]}
          valore={periodo}
          onChange={setPeriodo}
        />
        {isTitolare && (
          <select className="field !w-auto !py-1.5 !text-xs" value={filtroComm} onChange={(e) => setFiltroComm(e.target.value)}>
            <option value="">Tutti i commerciali</option>
            {commerciali.filter((c) => c.ruolo === 'commerciale').map((c) => (
              <option key={c.id} value={c.id}>{nomeCompleto(c)}</option>
            ))}
          </select>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Misura</span>
          <Pillole valori={metriche} valore={metricaEff} onChange={setMetrica} />
        </div>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile etichetta="Auto vendute" valore={String(nelPeriodo.length)} nota={etichettaPeriodo} />
        <StatTile etichetta="Fatturato" valore={euro(fatturato, true)} nota={nelPeriodo.length ? `medio ${euro(fatturato / nelPeriodo.length)}` : undefined} />
        {isTitolare ? (
          <StatTile
            etichetta="Margine lordo"
            valore={euro(margineTot, true)}
            nota={conMargine.length ? `medio ${euro(margineTot / conMargine.length)} · ${Math.round((margineTot / Math.max(fatturato, 1)) * 100)}%` : 'manca il prezzo di acquisto'}
          />
        ) : (
          <StatTile etichetta="Prezzo medio" valore={nelPeriodo.length ? euro(fatturato / nelPeriodo.length) : '-'} />
        )}
        <StatTile etichetta="Giorni medi in stock" valore={String(giorniMedi)} nota="dall'ingresso alla vendita" />
        <StatTile
          etichetta="In vetrina ora"
          valore={String(stock.length)}
          nota={fermiOltre.length ? `${fermiOltre.length} ferme da oltre ${SOGLIA_STOCK_FERMO} gg` : `valore ${euro(valoreStock, true)}`}
          tono={fermiOltre.length ? 'attenzione' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Pannello className="lg:col-span-2" titolo="Andamento mensile" sottotitolo={`Ultimi 12 mesi · ${metriche.find((m) => m.v === metricaEff)?.l}`}>
          <ColonneMensili colonne={colonne} formato={(n) => (metricaEff === 'vendite' ? String(Math.round(n)) : euro(n, true))} />
        </Pannello>

        <Pannello
          titolo="Cosa si vende"
          sottotitolo={mostraCoda ? 'Le prime 8, più le meno vendute' : undefined}
          azioni={
            <select className="field !w-auto !py-1 !text-xs" value={dim} onChange={(e) => setDim(e.target.value as Dimensione)}>
              {DIMENSIONI.map((d) => (
                <option key={d.v} value={d.v}>{d.l}</option>
              ))}
            </select>
          }
        >
          <BarreOrizzontali righe={mostraCoda ? barreDim.slice(0, 8) : barreDim} />
          {coda.length > 0 && (
            <div className="mt-4 border-t border-neutral-200 pt-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Vendono meno</p>
              {coda.map((r) => (
                <p key={r.chiave} className="flex justify-between text-xs text-neutral-700">
                  <span>{r.chiave}</span>
                  <span className="tabular-nums">{testo(r)}</span>
                </p>
              ))}
            </div>
          )}
        </Pannello>

        {isTitolare && !filtroComm ? (
          <Pannello titolo="Per commerciale" sottotitolo="Chi chiude di più nel periodo">
            <BarreOrizzontali righe={toBarre(perComm)} />
            <table className="mt-5 w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-[10px] uppercase tracking-wide text-neutral-500">
                  <th className="py-1.5 font-semibold">Commerciale</th>
                  <th className="py-1.5 text-right font-semibold">Fatturato</th>
                  <th className="py-1.5 text-right font-semibold">Margine medio</th>
                  <th className="py-1.5 text-right font-semibold">Gg medi</th>
                </tr>
              </thead>
              <tbody>
                {[...perComm].sort((a, b) => b.fatturato - a.fatturato).map((c) => (
                  <tr key={c.chiave} className="border-b border-neutral-200 last:border-0">
                    <td className="py-1.5 font-medium text-neutral-900">{c.chiave}</td>
                    <td className="py-1.5 text-right tabular-nums text-neutral-700">{euro(c.fatturato, true)}</td>
                    <td className="py-1.5 text-right tabular-nums text-neutral-700">{c.margineNoto ? euro(c.margine / c.margineNoto) : '-'}</td>
                    <td className="py-1.5 text-right tabular-nums text-neutral-700">{giorniComm(c.chiave)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Pannello>
        ) : (
          <Pannello titolo="Da dove arrivano i clienti" sottotitolo="Canale di provenienza della vendita">
            <BarreOrizzontali righe={toBarre(perCanale)} />
          </Pannello>
        )}

        <Pannello titolo="Zone: province" sottotitolo="Provincia di residenza dell'acquirente">
          <BarreOrizzontali righe={toBarre(perProv)} />
        </Pannello>

        <Pannello titolo="Zone: comuni" sottotitolo="I comuni con più acquirenti">
          <BarreOrizzontali righe={toBarre(perCitta).slice(0, 8)} />
        </Pannello>

        {isTitolare && !filtroComm && (
          <Pannello titolo="Da dove arrivano i clienti" sottotitolo="Canale di provenienza della vendita">
            <BarreOrizzontali righe={toBarre(perCanale)} />
          </Pannello>
        )}

        <Pannello titolo="Stock fermo" sottotitolo={`Auto in vetrina ordinate per giorni dall'ingresso · oltre ${SOGLIA_STOCK_FERMO} gg conviene rivedere il prezzo`}>
          {fermi.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-500">Nessuna auto in vetrina</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-200">
              {fermi.slice(0, 6).map((a) => (
                <Link key={a.id} to={`/modifica/${a.id}`} className="flex items-center justify-between gap-3 py-2 text-xs hover:text-brand">
                  <span className="truncate font-medium text-neutral-900">{a.marca} {a.modello}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums text-neutral-500">{euro(a.prezzo)}</span>
                    <span className={`flex items-center gap-1 tabular-nums font-semibold ${a.giorni >= SOGLIA_STOCK_FERMO ? 'text-red-600' : 'text-neutral-700'}`}>
                      {a.giorni >= SOGLIA_STOCK_FERMO && <AlertTriangle className="h-3 w-3" />}
                      {a.giorni} gg
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Pannello>
      </div>

      {/* Vista tabellare: le ultime vendite */}
      <Pannello className="mt-4" titolo="Ultime vendite" sottotitolo={`${nelPeriodo.length} nel periodo, le più recenti`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wide text-neutral-500">
              <tr className="border-b border-neutral-200">
                <th className="py-2 font-semibold">Data</th>
                <th className="py-2 font-semibold">Auto</th>
                <th className="py-2 font-semibold">Cliente</th>
                <th className="py-2 font-semibold">Commerciale</th>
                <th className="py-2 font-semibold">Canale</th>
                <th className="py-2 text-right font-semibold">Prezzo</th>
                {isTitolare && <th className="py-2 text-right font-semibold">Margine</th>}
              </tr>
            </thead>
            <tbody>
              {nelPeriodo.slice(0, 12).map((v) => {
                const mg = margine(v)
                return (
                  <tr key={v.id} className="border-b border-neutral-200 last:border-0">
                    <td className="py-2 tabular-nums text-neutral-500">{new Date(v.venduto_il!).toLocaleDateString('it-IT')}</td>
                    <td className="py-2 font-medium text-neutral-900">{v.marca} {v.modello}</td>
                    <td className="py-2 text-neutral-700">
                      {[v.cliente_nome, v.cliente_cognome].filter(Boolean).join(' ') || '-'}
                      {v.cliente_provincia && <span className="text-neutral-500"> · {v.cliente_provincia}</span>}
                    </td>
                    <td className="py-2 text-neutral-700">{nomeCompleto(commerciali.find((c) => c.id === v.commerciale_id)) || '-'}</td>
                    <td className="py-2 text-neutral-700">{v.canale_vendita || '-'}</td>
                    <td className="py-2 text-right tabular-nums text-neutral-900">{euro(incasso(v))}</td>
                    {isTitolare && <td className="py-2 text-right tabular-nums text-neutral-700">{mg == null ? '-' : euro(mg)}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Pannello>
    </Layout>
  )
}
