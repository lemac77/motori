import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { PhotoUploader } from '../components/PhotoUploader'
import { Layout } from '../components/Layout'
import { MARCHE, MARCA_NON_IN_LISTA } from '../lib/marche'
import { ELENCO_ACCESSORI } from '../lib/accessori'
import { useUtente } from '../lib/utente'

interface Foto {
  id: string
  url_thumbnail: string
  ordine: number
}

const ALIMENTAZIONI = ['Benzina', 'Diesel', 'GPL', 'Metano', 'Elettrica', 'Ibrida']
const CAMBI = ['Manuale', 'Automatico']
const CONDIZIONI = ['Usato', 'Nuovo', 'Km0']

export function FormAnnuncio() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    marca: '',
    modello: '',
    versione: '',
    prezzo: '',
    condizione: 'Usato',
    immatricolazione_mese: '',
    immatricolazione_anno: '',
    km: '',
    alimentazione: 'Benzina',
    cambio: 'Manuale',
    colore: '',
    targa: '',
    numero_telaio: '',
    carrozzeria: '',
    porte: '',
    posti: '',
    classe_emissioni: '',
    cv: '',
    cilindrata_cc: '',
    descrizione: '',
    stato_pubblicazione: 'bozza',
    prezzo_acquisto: '',
    costi_ripristino: '',
  })
  const { isTitolare } = useUtente()

  const [foto, setFoto] = useState<Foto[]>([])
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'ok' | 'error' | null>(null)
  const [annuncioId, setAnnuncioId] = useState<string | null>(id ?? null)
  const [preparazione, setPreparazione] = useState(!id)
  const [modelliSuggeriti, setModelliSuggeriti] = useState<string[]>([])
  const [versioniSuggerite, setVersioniSuggerite] = useState<string[]>([])
  const [marcaAltro, setMarcaAltro] = useState(false)
  const [accessoriSelezionati, setAccessoriSelezionati] = useState<string[]>([])
  const [filtroAccessori, setFiltroAccessori] = useState('')
  const bozzaAutoCreataRef = useRef(false)

  useEffect(() => {
    if (id) {
      loadAnnuncio(id)
    } else {
      creaBozza()
    }
    loadSuggerimenti()
  }, [id])

  // Crea subito una bozza vuota così l'annuncio ha un id fin da subito:
  // le foto si possono caricare senza dover salvare prima il form.
  async function creaBozza() {
    const { data, error } = await supabase
      .from('annunci')
      .insert({ marca: '', modello: '', prezzo: 0, alimentazione: 'Benzina', cambio: 'Manuale', stato_pubblicazione: 'bozza' })
      .select()
      .single()
    if (!error && data) {
      bozzaAutoCreataRef.current = true
      setAnnuncioId(data.id)
      window.history.replaceState(null, '', `/modifica/${data.id}`)
    }
    setPreparazione(false)
  }

  async function loadAnnuncio(annuncioId: string) {
    const { data } = await supabase.from('annunci').select('*').eq('id', annuncioId).single()
    if (data) {
      setForm({
        ...data,
        prezzo: String(data.prezzo ?? ''),
        immatricolazione_mese: String(data.immatricolazione_mese ?? ''),
        immatricolazione_anno: String(data.immatricolazione_anno ?? ''),
        km: String(data.km ?? ''),
        posti: String(data.posti ?? ''),
        cv: String(data.cv ?? ''),
        cilindrata_cc: String(data.cilindrata_cc ?? ''),
        prezzo_acquisto: data.prezzo_acquisto == null ? '' : String(data.prezzo_acquisto),
        costi_ripristino: data.costi_ripristino == null ? '' : String(data.costi_ripristino),
      })
      if (data.marca && !MARCHE.includes(data.marca)) {
        setMarcaAltro(true)
      }
      setAccessoriSelezionati(Array.isArray(data.accessori) ? data.accessori : [])
    }
    loadFoto(annuncioId)
  }

  // Autocomplete su modello/versione basato sullo storico annunci già inseriti:
  // niente database esterno da mantenere, il pannello "impara" da solo.
  async function loadSuggerimenti() {
    const { data } = await supabase.from('annunci').select('modello, versione')
    if (data) {
      const modelli = Array.from(new Set(data.map((d) => d.modello).filter(Boolean)))
      const versioni = Array.from(new Set(data.map((d) => d.versione).filter(Boolean)))
      setModelliSuggeriti(modelli as string[])
      setVersioniSuggerite(versioni as string[])
    }
  }

  async function loadFoto(annuncioId: string) {
    const { data } = await supabase
      .from('annuncio_foto')
      .select('id, url_thumbnail, ordine')
      .eq('annuncio_id', annuncioId)
      .order('ordine')
    setFoto(data ?? [])
  }

  function updateField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!annuncioId) return
    setSaving(true)
    setSaveStatus(null)

    const payload = {
      marca: form.marca,
      modello: form.modello,
      versione: form.versione || null,
      prezzo: Number(form.prezzo),
      condizione: form.condizione,
      immatricolazione_mese: form.immatricolazione_mese ? Number(form.immatricolazione_mese) : null,
      immatricolazione_anno: form.immatricolazione_anno ? Number(form.immatricolazione_anno) : null,
      km: Number(form.km) || 0,
      alimentazione: form.alimentazione,
      cambio: form.cambio,
      colore: form.colore || null,
      targa: form.targa || null,
      numero_telaio: form.numero_telaio || null,
      carrozzeria: form.carrozzeria || null,
      porte: form.porte || null,
      posti: form.posti ? Number(form.posti) : null,
      classe_emissioni: form.classe_emissioni || null,
      cv: form.cv ? Number(form.cv) : null,
      cilindrata_cc: form.cilindrata_cc ? Number(form.cilindrata_cc) : null,
      descrizione: form.descrizione || null,
      stato_pubblicazione: form.stato_pubblicazione,
      accessori: accessoriSelezionati,
      // prezzo di acquisto e costi: li vede e li salva solo il titolare
      ...(isTitolare && {
        prezzo_acquisto: form.prezzo_acquisto === '' ? null : Number(form.prezzo_acquisto),
        costi_ripristino: form.costi_ripristino === '' ? null : Number(form.costi_ripristino),
      }),
    }

    const { error } = await supabase.from('annunci').update(payload).eq('id', annuncioId)
    bozzaAutoCreataRef.current = false

    setSaving(false)
    setSaveStatus(error ? 'error' : 'ok')
    if (!error) setTimeout(() => setSaveStatus(null), 3000)
  }

  // Se l'utente torna indietro senza aver scritto nulla, elimina la bozza
  // auto-creata invece di lasciare un annuncio vuoto in lista.
  async function handleTornaIndietro() {
    if (bozzaAutoCreataRef.current && annuncioId && !form.marca.trim() && !form.modello.trim() && foto.length === 0) {
      await supabase.from('annunci').delete().eq('id', annuncioId)
    }
    navigate('/')
  }

  async function eliminaFoto(fotoId: string) {
    await supabase.from('annuncio_foto').delete().eq('id', fotoId)
    if (annuncioId) loadFoto(annuncioId)
  }

  function spostaFoto(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= foto.length) return

    const riordinate = [...foto]
    const [spostata] = riordinate.splice(fromIndex, 1)
    riordinate.splice(toIndex, 0, spostata)

    setFoto(riordinate)

    // Persiste il nuovo ordine su Supabase
    riordinate.forEach((f, i) => {
      supabase.from('annuncio_foto').update({ ordine: i }).eq('id', f.id).then()
    })
  }

  return (
    <Layout>
      <button
        onClick={handleTornaIndietro}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Torna alla lista
      </button>

      <h1 className="font-display mb-6 text-2xl font-bold text-neutral-900">
        {id ? 'Modifica annuncio' : 'Nuovo annuncio'}
      </h1>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Marca</label>
            <select
              className="field"
              value={marcaAltro ? MARCA_NON_IN_LISTA : form.marca}
              onChange={(e) => {
                if (e.target.value === MARCA_NON_IN_LISTA) {
                  setMarcaAltro(true)
                  updateField('marca', '')
                } else {
                  setMarcaAltro(false)
                  updateField('marca', e.target.value)
                }
              }}
            >
              <option value="">Seleziona marca</option>
              {MARCHE.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {marcaAltro && (
            <div>
              <label className="field-label">Marca (specifica)</label>
              <input
                className="field"
                placeholder="Scrivi la marca, es. Piaggio, Iveco..."
                value={form.marca}
                onChange={(e) => updateField('marca', e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="field-label">Modello</label>
            <input
              className="field"
              list="modelli-suggeriti"
              placeholder="es. Giulietta (2010-21)"
              value={form.modello}
              onChange={(e) => updateField('modello', e.target.value)}
            />
            <datalist id="modelli-suggeriti">
              {modelliSuggeriti.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Versione</label>
            <input
              className="field"
              list="versioni-suggerite"
              placeholder="es. Giulietta 1.4 Turbo 120 CV Progression"
              value={form.versione}
              onChange={(e) => updateField('versione', e.target.value)}
            />
            <datalist id="versioni-suggerite">
              {versioniSuggerite.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="field-label">Prezzo (€)</label>
            <input
              type="number"
              className="field"
              placeholder="12900"
              value={form.prezzo}
              onChange={(e) => updateField('prezzo', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Condizione</label>
            <select
              className="field"
              value={form.condizione}
              onChange={(e) => updateField('condizione', e.target.value)}
            >
              {CONDIZIONI.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Mese immatricolazione</label>
            <input
              type="number"
              className="field"
              min={1}
              max={12}
              placeholder="10"
              value={form.immatricolazione_mese}
              onChange={(e) => updateField('immatricolazione_mese', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Anno immatricolazione</label>
            <input
              type="number"
              className="field"
              placeholder="2013"
              value={form.immatricolazione_anno}
              onChange={(e) => updateField('immatricolazione_anno', e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Km</label>
            <input
              type="number"
              className="field"
              placeholder="169000"
              value={form.km}
              onChange={(e) => updateField('km', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Alimentazione</label>
            <select
              className="field"
              value={form.alimentazione}
              onChange={(e) => updateField('alimentazione', e.target.value)}
            >
              {ALIMENTAZIONI.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Cambio</label>
            <select className="field" value={form.cambio} onChange={(e) => updateField('cambio', e.target.value)}>
              {CAMBI.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Colore</label>
            <input
              className="field"
              placeholder="Nero"
              value={form.colore}
              onChange={(e) => updateField('colore', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Targa</label>
            <input
              className="field"
              placeholder="AB123CD"
              value={form.targa}
              onChange={(e) => updateField('targa', e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="field-label">Numero telaio</label>
            <input
              className="field"
              placeholder="WBA..."
              value={form.numero_telaio}
              onChange={(e) => updateField('numero_telaio', e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label className="field-label">Carrozzeria</label>
            <input
              className="field"
              placeholder="Berlina, SUV, Station Wagon..."
              value={form.carrozzeria}
              onChange={(e) => updateField('carrozzeria', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Porte</label>
            <input
              className="field"
              placeholder="4/5"
              value={form.porte}
              onChange={(e) => updateField('porte', e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Posti</label>
            <input
              type="number"
              className="field"
              placeholder="5"
              value={form.posti}
              onChange={(e) => updateField('posti', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Classe emissioni</label>
            <input
              className="field"
              placeholder="Euro 6"
              value={form.classe_emissioni}
              onChange={(e) => updateField('classe_emissioni', e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">CV</label>
            <input
              type="number"
              className="field"
              placeholder="120"
              value={form.cv}
              onChange={(e) => updateField('cv', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Cilindrata (Cc)</label>
            <input
              type="number"
              className="field"
              placeholder="1598"
              value={form.cilindrata_cc}
              onChange={(e) => updateField('cilindrata_cc', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Stato pubblicazione</label>
            <select
              className="field"
              value={form.stato_pubblicazione}
              onChange={(e) => updateField('stato_pubblicazione', e.target.value)}
            >
              <option value="bozza">Bozza</option>
              <option value="pubblicato">Pubblicato</option>
              <option value="venduto">Venduto</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Descrizione</label>
            <textarea
              className="field"
              rows={5}
              placeholder="Vendo Alfa Romeo Giulietta 2013, 120 CV, turbo benzina..."
              value={form.descrizione}
              onChange={(e) => updateField('descrizione', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={handleSubmit} disabled={saving || preparazione} className="btn-primary">
            {preparazione ? 'Preparazione...' : saving ? 'Salvataggio...' : 'Salva annuncio'}
          </button>
          {saveStatus === 'ok' && (
            <span className="text-sm font-semibold text-emerald-600">Salvato</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm font-semibold text-red-600">
              Errore durante il salvataggio, riprova
            </span>
          )}
        </div>
      </div>

      {isTitolare && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-neutral-900">Acquisto e margine</h2>
          <p className="mb-4 text-xs text-neutral-500">Visibile solo al titolare. Alimenta margini e analitiche nella sezione Vendite.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label">Prezzo di acquisto (€)</label>
              <input type="number" className="field" value={form.prezzo_acquisto} onChange={(e) => setForm({ ...form, prezzo_acquisto: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Costi di ripristino (€)</label>
              <input type="number" className="field" value={form.costi_ripristino} onChange={(e) => setForm({ ...form, costi_ripristino: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Margine stimato</label>
              <div className="field flex items-center font-bold">
                {form.prezzo && form.prezzo_acquisto
                  ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
                      Number(form.prezzo) - Number(form.prezzo_acquisto) - Number(form.costi_ripristino || 0)
                    )
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-neutral-900">
            Accessori <span className="text-sm font-normal text-neutral-500">({accessoriSelezionati.length} selezionati)</span>
          </h2>
        </div>

        <input
          type="text"
          className="field mb-4"
          placeholder="Cerca un accessorio (es. cerchi, navigatore, sedili...)"
          value={filtroAccessori}
          onChange={(e) => setFiltroAccessori(e.target.value)}
        />

        <div className="grid max-h-80 grid-cols-1 gap-x-4 gap-y-2 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2 md:grid-cols-3">
          {ELENCO_ACCESSORI.filter((acc) => acc.toLowerCase().includes(filtroAccessori.toLowerCase())).map((acc) => (
            <label key={acc} className="flex items-center gap-2 text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={accessoriSelezionati.includes(acc)}
                onChange={(e) => {
                  setAccessoriSelezionati((prev) =>
                    e.target.checked ? [...prev, acc] : prev.filter((x) => x !== acc)
                  )
                }}
                className="h-4 w-4 shrink-0 rounded border-neutral-300 bg-white accent-brand"
              />
              {acc}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Foto</h2>

        {preparazione ? (
          <p className="text-sm text-neutral-500">Preparazione annuncio...</p>
        ) : annuncioId ? (
          <>
            <PhotoUploader annuncioId={annuncioId} onUploaded={() => loadFoto(annuncioId)} />

            {foto.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {foto.map((f, index) => (
                  <div
                    key={f.id}
                    className="group relative aspect-4/3 overflow-hidden rounded-lg bg-neutral-100"
                  >
                    <img src={f.url_thumbnail} alt="" className="h-full w-full object-cover" />

                    {index === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-brand/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        Copertina
                      </span>
                    )}

                    {/* Controlli sempre visibili (niente hover, serve funzionare bene anche al tocco) */}
                    <button
                      onClick={() => eliminaFoto(f.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
                      <button
                        onClick={() => spostaFoto(index, index - 1)}
                        disabled={index === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => spostaFoto(index, index + 1)}
                        disabled={index === foto.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {foto.length > 1 && (
              <p className="mt-3 text-xs text-neutral-600">
                Usa le frecce per riordinare le foto. La prima è quella di copertina nella lista e sul sito.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-red-600">
            Errore nella preparazione dell'annuncio, ricarica la pagina e riprova.
          </p>
        )}
      </div>

      <button
        onClick={handleTornaIndietro}
        className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Torna alla lista
      </button>
    </Layout>
  )
}