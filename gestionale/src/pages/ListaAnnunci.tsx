import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Gauge, Calendar, ImageOff, TrendingUp, Tag, X, FileText, Receipt, Copy, Upload, Download, Clock, Printer } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/Layout'
import { VenditaModal } from '../components/VenditaModal'
import { useUtente } from '../lib/utente'
import { scaricaCsv } from '../lib/csv'
import { generaCartellino } from '../lib/cartellino'

interface Annuncio {
  id: string
  marca: string
  modello: string
  prezzo: number
  prezzo_finale_vendita: number | null
  venduto_il: string | null
  km: number
  immatricolazione_anno: number | null
  stato_pubblicazione: 'bozza' | 'pubblicato' | 'venduto'
  created_at: string
  targa: string | null
  alimentazione: string | null
  cambio: string | null
  cv: number | null
  prezzo_acquisto: number | null
  costi_ripristino: number | null
  annuncio_foto: { url_thumbnail: string; ordine: number }[]
}

const SOGLIA_FERMA = 60
const giorniDa = (d: string) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))

const STATI = ['bozza', 'pubblicato', 'venduto'] as const

const STATO_STYLE: Record<string, string> = {
  bozza: 'bg-neutral-100 text-neutral-600',
  pubblicato: 'bg-brand/15 text-brand',
  venduto: 'bg-emerald-500/15 text-emerald-600',
}

const STATO_LABEL: Record<string, string> = {
  bozza: 'Bozza',
  pubblicato: 'Pubblicato',
  venduto: 'Venduto',
}

export function ListaAnnunci() {
  const { isTitolare } = useUtente()
  const [fermi, setFermi] = useState(false)
  const [annunci, setAnnunci] = useState<Annuncio[]>([])
  const [loading, setLoading] = useState(true)

  // Filtri
  const [filtroMarca, setFiltroMarca] = useState('')
  // Di default solo lo stock (bozze + pubblicati): le vendute sono nello storico
  const [filtroStato, setFiltroStato] = useState('stock')
  const [venditaPer, setVenditaPer] = useState<{ id: string; titolo: string } | null>(null)
  const [filtroPrezzoMin, setFiltroPrezzoMin] = useState('')
  const [filtroPrezzoMax, setFiltroPrezzoMax] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('annunci')
      .select(
        'id, marca, modello, prezzo, prezzo_finale_vendita, venduto_il, km, immatricolazione_anno, stato_pubblicazione, created_at, targa, alimentazione, cambio, cv, prezzo_acquisto, costi_ripristino, annuncio_foto(url_thumbnail, ordine)'
      )
      .order('created_at', { ascending: false })
      .order('ordine', { foreignTable: 'annuncio_foto', ascending: true })

    setAnnunci((data as Annuncio[]) ?? [])
    setLoading(false)
  }

  async function eliminaAnnuncio(id: string) {
    if (!confirm('Eliminare questo annuncio? Verranno eliminate anche tutte le foto.')) return
    await supabase.from('annunci').delete().eq('id', id)
    load()
  }

  // Duplica: stessa scheda (senza foto, targa e telaio), come bozza. Utile per auto simili.
  async function duplica(id: string) {
    const { data } = await supabase.from('annunci').select('*').eq('id', id).single()
    if (!data) return
    const copia: Record<string, unknown> = { ...data }
    for (const k of ['id', 'created_at', 'updated_at', 'targa', 'numero_telaio', 'venduto_il', 'prezzo_finale_vendita', 'commerciale_id', 'canale_vendita']) delete copia[k]
    for (const k of Object.keys(copia)) if (k.startsWith('cliente_') || k.startsWith('permuta_')) delete copia[k]
    copia.stato_pubblicazione = 'bozza'
    const { data: nuova } = await supabase.from('annunci').insert(copia).select('id').single()
    if (nuova) window.location.href = `/modifica/${nuova.id}`
    else alert('Non sono riuscito a duplicare l’annuncio.')
  }

  async function esportaCsv() {
    const { data } = await supabase.from('annunci').select('*').order('created_at', { ascending: false })
    const righe = ((data as Record<string, unknown>[]) ?? []).filter((a) => filtroStato === 'stock' ? a.stato_pubblicazione !== 'venduto' : true)
    const col: [string, string][] = [
      ['marca', 'Marca'], ['modello', 'Modello'], ['versione', 'Versione'], ['prezzo', 'Prezzo'], ['condizione', 'Condizione'],
      ['immatricolazione_mese', 'Mese immatricolazione'], ['immatricolazione_anno', 'Anno immatricolazione'], ['km', 'Km'],
      ['alimentazione', 'Alimentazione'], ['cambio', 'Cambio'], ['colore', 'Colore'], ['targa', 'Targa'], ['numero_telaio', 'Telaio'],
      ['carrozzeria', 'Carrozzeria'], ['cv', 'CV'], ['stato_pubblicazione', 'Stato'], ['venduto_il', 'Venduta il'],
      ...(isTitolare ? ([['prezzo_acquisto', 'Prezzo acquisto'], ['costi_ripristino', 'Costi ripristino'], ['prezzo_finale_vendita', 'Prezzo finale']] as [string, string][]) : []),
    ]
    scaricaCsv(`parco-auto-${new Date().toISOString().slice(0, 10)}.csv`, [
      col.map(([, l]) => l),
      ...righe.map((r) => col.map(([k]) => r[k] as string | number | null)),
    ])
  }

  // Cambia stato direttamente dalla lista, senza aprire il form
  async function cambiaStato(id: string, nuovoStato: string) {
    // "Venduto" passa dalla scheda vendita (data, prezzo, commerciale, cliente)
    if (nuovoStato === 'venduto') {
      const a = annunci.find((x) => x.id === id)
      setVenditaPer({ id, titolo: a ? `${a.marca} ${a.modello}` : 'Auto' })
      return
    }
    setAnnunci((prev) =>
      prev.map((a) => (a.id === id ? { ...a, stato_pubblicazione: nuovoStato as Annuncio['stato_pubblicazione'] } : a))
    )
    await supabase.from('annunci').update({ stato_pubblicazione: nuovoStato }).eq('id', id)
  }

  const formatPrezzo = (p: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p)

  // Marche effettivamente presenti tra gli annunci (incluse quelle "Altro" scritte a mano),
  // così il filtro mostra sempre solo opzioni utili e complete
  const marcheDisponibili = useMemo(
    () => Array.from(new Set(annunci.map((a) => a.marca))).sort((a, b) => a.localeCompare(b, 'it')),
    [annunci]
  )

  const annunciFiltrati = annunci.filter((a) => {
    if (filtroMarca && a.marca !== filtroMarca) return false
    if (filtroStato === 'stock' && a.stato_pubblicazione === 'venduto') return false
    if (filtroStato && filtroStato !== 'stock' && a.stato_pubblicazione !== filtroStato) return false
    if (fermi && (a.stato_pubblicazione === 'venduto' || giorniDa(a.created_at) < SOGLIA_FERMA)) return false
    if (filtroPrezzoMin && a.prezzo < Number(filtroPrezzoMin)) return false
    if (filtroPrezzoMax && a.prezzo > Number(filtroPrezzoMax)) return false
    return true
  })

  const filtriAttivi = Boolean(fermi || filtroMarca || filtroStato !== 'stock' || filtroPrezzoMin || filtroPrezzoMax)

  function resetFiltri() {
    setFiltroMarca('')
    setFiltroStato('stock')
    setFiltroPrezzoMin('')
    setFiltroPrezzoMax('')
    setFermi(false)
  }

  const venduti = annunci.filter((a) => a.stato_pubblicazione === 'venduto')
  const totaleIncassato = venduti.reduce((sum, a) => sum + Number(a.prezzo_finale_vendita ?? a.prezzo), 0)
  const inStock = annunci.length - venduti.length

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Annunci</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {annunciFiltrati.length} mostrati · {inStock} in stock · {venduti.length} vendute
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link to="/importa" className="btn-secondary" title="Importa auto da un file Excel/CSV">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importa</span>
          </Link>
          <button onClick={esportaCsv} className="btn-secondary" title="Scarica l'elenco in CSV (apribile con Excel)">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Esporta</span>
          </button>
          <Link to="/nuovo" className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuovo annuncio
          </Link>
        </div>
      </div>

      {!loading && annunci.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <Tag className="h-3.5 w-3.5" />
              Auto vendute
            </div>
            <p className="font-display mt-1 text-2xl font-bold text-neutral-900">{venduti.length}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <TrendingUp className="h-3.5 w-3.5" />
              Totale incassato
            </div>
            <p className="font-display mt-1 text-2xl font-bold text-emerald-600">{formatPrezzo(totaleIncassato)}</p>
          </div>
        </div>
      )}

      {!loading && annunci.length > 0 && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div>
            <label className="field-label">Marca</label>
            <select
              className="field !py-2 !text-xs"
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
            >
              <option value="">Tutte</option>
              {marcheDisponibili.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Stato</label>
            <select
              className="field !py-2 !text-xs"
              value={filtroStato}
              onChange={(e) => setFiltroStato(e.target.value)}
            >
              <option value="stock">In stock</option>
              <option value="">Tutti</option>
              {STATI.map((s) => (
                <option key={s} value={s}>
                  {STATO_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Prezzo min (€)</label>
            <input
              type="number"
              className="field !py-2 !text-xs w-28"
              placeholder="0"
              value={filtroPrezzoMin}
              onChange={(e) => setFiltroPrezzoMin(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Prezzo max (€)</label>
            <input
              type="number"
              className="field !py-2 !text-xs w-28"
              placeholder="50000"
              value={filtroPrezzoMax}
              onChange={(e) => setFiltroPrezzoMax(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 self-end rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600">
            <input type="checkbox" checked={fermi} onChange={(e) => setFermi(e.target.checked)} />
            Ferme da {SOGLIA_FERMA}+ giorni
          </label>

          {filtriAttivi && (
            <button
              onClick={resetFiltri}
              className="flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <X className="h-3.5 w-3.5" />
              Rimuovi filtri
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Caricamento...</p>
      ) : annunci.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-500">Nessun annuncio ancora. Creane uno per iniziare.</p>
        </div>
      ) : annunciFiltrati.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-500">Nessun annuncio corrisponde ai filtri selezionati.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {annunciFiltrati.map((a) => {
            const copertina = [...a.annuncio_foto].sort((x, y) => x.ordine - y.ordine)[0]
            return (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm transition-colors hover:border-neutral-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {copertina ? (
                      <img src={copertina.url_thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-300">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <select
                    value={a.stato_pubblicazione}
                    onChange={(e) => cambiaStato(a.id, e.target.value)}
                    className={`shrink-0 rounded-full border-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide outline-none ${STATO_STYLE[a.stato_pubblicazione]}`}
                  >
                    {STATI.map((s) => (
                      <option key={s} value={s} className="bg-white text-neutral-900">
                        {STATO_LABEL[s]}
                      </option>
                    ))}
                  </select>

                  <div className="min-w-0">
                    <p className="font-display truncate text-sm font-bold text-neutral-900">
                      {a.marca} {a.modello}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                      {a.immatricolazione_anno && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {a.immatricolazione_anno}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> {a.km.toLocaleString('it-IT')} km
                      </span>
                      {a.stato_pubblicazione !== 'venduto' && (() => {
                        const g = giorniDa(a.created_at)
                        const tono = g >= 90 ? 'text-red-600' : g >= SOGLIA_FERMA ? 'text-amber-600' : ''
                        return (
                          <span className={`flex items-center gap-1 ${tono}`} title="Giorni da quando l'auto è in stock">
                            <Clock className="h-3 w-3" /> {g} {g === 1 ? 'giorno' : 'giorni'}
                          </span>
                        )
                      })()}
                      {isTitolare && a.prezzo_acquisto != null && a.stato_pubblicazione !== 'venduto' && (
                        <span title="Margine previsto: prezzo meno acquisto e ripristino">
                          Margine {formatPrezzo(Number(a.prezzo) - Number(a.prezzo_acquisto) - Number(a.costi_ripristino ?? 0))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <span className="font-display text-lg font-bold text-neutral-900">{formatPrezzo(Number(a.prezzo_finale_vendita ?? a.prezzo))}</span>
                    {a.venduto_il && (
                      <p className="text-[11px] text-neutral-500">venduta il {new Date(a.venduto_il).toLocaleDateString('it-IT')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/modifica/${a.id}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    {a.stato_pubblicazione === 'venduto' && (
                      <button
                        onClick={() => setVenditaPer({ id: a.id, titolo: `${a.marca} ${a.modello}` })}
                        title="Dati vendita"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {a.stato_pubblicazione !== 'venduto' && (
                      <button
                        onClick={() => generaCartellino({ id: a.id, marca: a.marca, modello: a.modello, prezzo: Number(a.prezzo), km: a.km, anno: a.immatricolazione_anno, alimentazione: a.alimentazione, cambio: a.cambio, cv: a.cv, targa: a.targa })}
                        title="Stampa il cartellino per il parabrezza (con QR)"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => duplica(a.id)}
                      title="Duplica come bozza"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      to={`/documenti/${a.id}`}
                      title="Documenti di vendita"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => eliminaAnnuncio(a.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {venditaPer && (
        <VenditaModal
          annuncioId={venditaPer.id}
          titolo={venditaPer.titolo}
          onClose={() => setVenditaPer(null)}
          onSaved={() => {
            setVenditaPer(null)
            load()
          }}
        />
      )}
    </Layout>
  )
}