import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Search, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/Layout'
import { SottoNavDocumenti } from '../components/SottoNavDocumenti'

interface AnnuncioSemplice {
  id: string
  marca: string
  modello: string
  versione: string | null
  stato_pubblicazione: string
}

const STATO_LABEL: Record<string, string> = {
  bozza: 'Bozza',
  pubblicato: 'Pubblicato',
  venduto: 'Venduto',
}

export function DocumentiHome() {
  const navigate = useNavigate()
  const [annunci, setAnnunci] = useState<AnnuncioSemplice[]>([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [ricerca, setRicerca] = useState('')

  useEffect(() => {
    supabase
      .from('annunci')
      .select('id, marca, modello, versione, stato_pubblicazione')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnnunci(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtrati = useMemo(() => {
    const q = ricerca.toLowerCase()
    return annunci.filter((a) => `${a.marca} ${a.modello} ${a.versione || ''}`.toLowerCase().includes(q))
  }, [annunci, ricerca])

  // Crea un annuncio "vuoto" (bozza, mai visibile sul sito pubblico) solo per generare
  // documenti da zero, senza partire da un'auto già in vetrina.
  async function nuovoDocumentoVuoto() {
    setCreando(true)
    const { data, error } = await supabase
      .from('annunci')
      .insert({
        marca: '',
        modello: '',
        prezzo: 0,
        km: 0,
        condizione: 'Usato',
        alimentazione: 'Benzina',
        cambio: 'Manuale',
        stato_pubblicazione: 'bozza',
      })
      .select()
      .single()

    setCreando(false)
    if (!error && data) navigate(`/documenti/${data.id}`)
  }

  return (
    <Layout>
      <SottoNavDocumenti />
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-neutral-900">Documenti di Vendita</h1>
        <button onClick={nuovoDocumentoVuoto} disabled={creando} className="btn-primary">
          <Plus className="h-4 w-4" />
          {creando ? 'Creazione...' : 'Nuovo documento vuoto'}
        </button>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Scegli un'auto già presente per generare i suoi documenti,
        <br />
        oppure crea un documento da zero senza partire da un annuncio.
      </p>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          className="field !pl-10"
          placeholder="Cerca per marca o modello..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Caricamento...</p>
      ) : filtrati.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <p className="text-sm text-neutral-500">Nessun annuncio trovato.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrati.map((a) => (
            <Link
              key={a.id}
              to={`/documenti/${a.id}`}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-brand"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-brand" />
                <div>
                  <p className="font-display text-sm font-bold text-neutral-900">
                    {a.marca || a.modello ? `${a.marca} ${a.versione || a.modello}` : '(documento senza auto collegata)'}
                  </p>
                  <p className="text-xs text-neutral-500">{STATO_LABEL[a.stato_pubblicazione] || a.stato_pubblicazione}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}