import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Gauge, Calendar, ImageOff, TrendingUp, Tag, X, FileText } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/Layout'

interface Annuncio {
  id: string
  marca: string
  modello: string
  prezzo: number
  km: number
  immatricolazione_anno: number | null
  stato_pubblicazione: 'bozza' | 'pubblicato' | 'venduto'
  annuncio_foto: { url_thumbnail: string; ordine: number }[]
}

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
  const [annunci, setAnnunci] = useState<Annuncio[]>([])
  const [loading, setLoading] = useState(true)

  // Filtri
  const [filtroMarca, setFiltroMarca] = useState('')
  const [filtroStato, setFiltroStato] = useState('')
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
        'id, marca, modello, prezzo, km, immatricolazione_anno, stato_pubblicazione, annuncio_foto(url_thumbnail, ordine)'
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

  // Cambia stato direttamente dalla lista, senza aprire il form
  async function cambiaStato(id: string, nuovoStato: string) {
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
    if (filtroStato && a.stato_pubblicazione !== filtroStato) return false
    if (filtroPrezzoMin && a.prezzo < Number(filtroPrezzoMin)) return false
    if (filtroPrezzoMax && a.prezzo > Number(filtroPrezzoMax)) return false
    return true
  })

  const filtriAttivi = Boolean(filtroMarca || filtroStato || filtroPrezzoMin || filtroPrezzoMax)

  function resetFiltri() {
    setFiltroMarca('')
    setFiltroStato('')
    setFiltroPrezzoMin('')
    setFiltroPrezzoMax('')
  }

  const venduti = annunci.filter((a) => a.stato_pubblicazione === 'venduto')
  const totaleIncassato = venduti.reduce((sum, a) => sum + Number(a.prezzo), 0)

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Annunci</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {annunciFiltrati.length} di {annunci.length} {annunci.length === 1 ? 'annuncio' : 'annunci'}
          </p>
        </div>
        <Link to="/nuovo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuovo annuncio
        </Link>
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
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-display text-lg font-bold text-neutral-900">{formatPrezzo(a.prezzo)}</span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/modifica/${a.id}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
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
    </Layout>
  )
}