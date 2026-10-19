import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Download, Trash2, Search, FileText } from 'lucide-react'
import { Layout } from '../components/Layout'
import { SottoNavDocumenti } from '../components/SottoNavDocumenti'
import {
  listaTuttiIDocumenti,
  urlDownloadArchivio,
  eliminaDaArchivio,
  ORDINE_TIPI_DOCUMENTO,
  LABEL_TIPO,
  type DocumentoArchiviatoConAuto,
  type TipoDocumento,
} from '../lib/archivioDocumenti'

export function ArchivioGenerale() {
  const [documenti, setDocumenti] = useState<DocumentoArchiviatoConAuto[]>([])
  const [loading, setLoading] = useState(true)
  const [errore, setErrore] = useState(false)
  const [ricerca, setRicerca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoDocumento | 'tutti'>('tutti')

  useEffect(() => {
    carica()
  }, [])

  async function carica() {
    setLoading(true)
    try {
      const lista = await listaTuttiIDocumenti()
      setDocumenti(lista)
      setErrore(false)
    } catch (err) {
      console.error('Archivio generale non disponibile', err)
      setErrore(true)
    }
    setLoading(false)
  }

  async function scarica(doc: DocumentoArchiviatoConAuto) {
    try {
      const url = await urlDownloadArchivio(doc.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      console.error(err)
      alert('Errore nel recupero del file. Riprova.')
    }
  }

  async function rimuovi(doc: DocumentoArchiviatoConAuto) {
    const conferma = confirm(`Eliminare "${doc.nome_file}" dall'archivio? Non si può annullare.`)
    if (!conferma) return
    try {
      await eliminaDaArchivio(doc.id, doc.storage_path)
      setDocumenti((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      console.error(err)
      alert("Errore nell'eliminazione. Riprova.")
    }
  }

  const filtrati = useMemo(() => {
    const q = ricerca.toLowerCase().trim()
    return documenti.filter((d) => {
      if (filtroTipo !== 'tutti' && d.tipo !== filtroTipo) return false
      if (!q) return true
      const nomeAuto = d.annunci ? `${d.annunci.marca} ${d.annunci.modello} ${d.annunci.versione || ''}` : ''
      return `${nomeAuto} ${d.numero_contratto || ''} ${d.nome_file}`.toLowerCase().includes(q)
    })
  }, [documenti, ricerca, filtroTipo])

  const gruppi = useMemo(() => {
    const mappa = new Map<TipoDocumento, DocumentoArchiviatoConAuto[]>()
    ORDINE_TIPI_DOCUMENTO.forEach((t) => mappa.set(t, []))
    filtrati.forEach((d) => {
      const lista = mappa.get(d.tipo) || []
      lista.push(d)
      mappa.set(d.tipo, lista)
    })
    return mappa
  }, [filtrati])

  const conteggiPerTipo = useMemo(() => {
    const mappa = new Map<TipoDocumento, number>()
    documenti.forEach((d) => mappa.set(d.tipo, (mappa.get(d.tipo) || 0) + 1))
    return mappa
  }, [documenti])

  return (
    <Layout>
      <SottoNavDocumenti />
      <div className="mb-1 flex items-center gap-2.5">
        <Archive className="h-6 w-6 text-brand" />
        <h1 className="font-display text-2xl font-bold text-neutral-900">Archivio Documenti</h1>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Tutti i documenti generati per tutti gli annunci, divisi per tipo.
      </p>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          className="field !pl-10"
          placeholder="Cerca per auto, numero contratto o nome file..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
        />
      </div>

      {/* Filtri per tipo documento */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroTipo('tutti')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
            filtroTipo === 'tutti'
              ? 'bg-brand text-white'
              : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Tutti ({documenti.length})
        </button>
        {ORDINE_TIPI_DOCUMENTO.map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filtroTipo === tipo
                ? 'bg-brand text-white'
                : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {LABEL_TIPO[tipo]} ({conteggiPerTipo.get(tipo) || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Caricamento...</p>
      ) : errore ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-500">
            Archivio non disponibile. Controlla di aver lanciato la migration <code>007_archivio_documenti.sql</code>{' '}
            e che il bucket Storage "documenti" esista su Supabase.
          </p>
        </div>
      ) : documenti.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-500">
            Nessun documento generato ancora. Appena scarichi un PDF da "Genera Documenti", comparirà qui.
          </p>
        </div>
      ) : filtrati.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-500">Nessun documento corrisponde alla ricerca/filtro.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {ORDINE_TIPI_DOCUMENTO.map((tipo) => {
            const lista = gruppi.get(tipo) || []
            if (lista.length === 0) return null
            return (
              <div key={tipo}>
                <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
                  <FileText className="h-4 w-4 text-brand" />
                  {LABEL_TIPO[tipo]}
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500">
                    {lista.length}
                  </span>
                </h2>
                <div className="flex flex-col gap-2">
                  {lista.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-900">
                          {doc.numero_contratto ? `N. ${doc.numero_contratto} — ` : ''}
                          {doc.annunci
                            ? `${doc.annunci.marca} ${doc.annunci.versione || doc.annunci.modello}`
                            : '(annuncio eliminato)'}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {LABEL_TIPO[doc.tipo]} · {new Date(doc.creato_il).toLocaleString('it-IT')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {doc.annunci && (
                          <Link
                            to={`/documenti/${doc.annuncio_id}`}
                            className="hidden text-xs font-semibold text-neutral-400 hover:text-neutral-900 sm:inline"
                          >
                            Vai all'annuncio
                          </Link>
                        )}
                        <button onClick={() => scarica(doc)} className="btn-secondary px-3 py-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" />
                          Scarica
                        </button>
                        <button
                          onClick={() => rimuovi(doc)}
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                          title="Elimina dall'archivio"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
