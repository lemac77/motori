import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Archive, Trash2, RefreshCw, PenLine } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/Layout'
import { FirmaPad } from '../components/FirmaPad'
import { impostaFirmaAcquirente } from '../lib/pdfHelpers'
import { calcolaRataMensile } from '../lib/finanziamento'
import { leggiImpostazioni } from '../lib/impostazioni'
import { generaNumeroContratto } from '../lib/numeroContratto'
import { listaDocumentiArchiviati, urlDownloadArchivio, eliminaDaArchivio, type DocumentoArchiviato } from '../lib/archivioDocumenti'
import {
  generaContrattoVendita,
  generaContrattoAcquisto,
  generaCertificatoConformita,
  generaSchedaPermuta,
  type AnnuncioDocumenti,
} from '../lib/generaDocumenti'

const VALORI_ESAME_TECNICO = ['Regolare', 'Sostituita', 'Sinistrata', 'Da verificare']
const VALORI_CONFORMITA = ['A', 'B', 'C']

const ORGANI_ESAME_TECNICO: [string, string][] = [
  ['motore', 'Motore'],
  ['distribuzione', 'Distribuzione'],
  ['frizione', 'Frizione'],
  ['cambio', 'Cambio'],
  ['turbina', 'Turbina'],
  ['telaio', 'Telaio'],
  ['parti_elettriche', 'Parti elettriche/elettroniche'],
  ['gruppo_guida', 'Gruppo guida'],
  ['impianto_frenante', 'Impianto frenante'],
]

const ORGANI_CONFORMITA_FORM: [string, string][] = [
  ['blocco_motore', 'Blocco motore e testata'],
  ['impianto_accensione', 'Impianto di accensione'],
  ['impianto_avviamento', 'Impianto di avviamento'],
  ['impianto_alimentazione', 'Impianto di alimentazione'],
  ['turbocompressore', 'Turbocompressore'],
  ['impianto_aspirazione', 'Impianto di aspirazione'],
  ['impianto_distribuzione', 'Impianto di distribuzione'],
  ['impianto_raffreddamento', 'Impianto di raffreddamento'],
  ['impianto_scarico', 'Impianto di scarico'],
  ['gruppo_frizione_cambio', 'Gruppo frizione / cambio'],
  ['cambio_automatico', 'Cambio automatico'],
  ['gruppo_guida_sterzo_freni', 'Gruppo guida, sterzo, freni'],
  ['impianto_aria_abitacolo', 'Impianto aria abitacolo'],
  ['impianto_elettrico_elettronico', 'Impianto elettrico/elettronico'],
  ['impianto_sospensioni', 'Impianto sospensioni'],
  ['carrozzeria_interni', 'Carrozzeria e interni'],
  ['tergicristalli', 'Tergicristalli e lavafari'],
  ['gps', 'Navigazione satellitare (GPS)'],
  ['vetri_elettrici', 'Vetri elettrici'],
  ['antifurto', 'Impianto antifurto'],
  ['chiusura_centralizzata', 'Chiusura centralizzata'],
  ['fari_xenon', 'Fari allo xenon'],
  ['impianto_stereo', 'Impianto stereo'],
  ['impianto_dvd', 'Impianto DVD'],
  ['impianto_bluetooth', 'Impianto Bluetooth'],
]

export function DocumentiVendita() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [annuncio, setAnnuncio] = useState<AnnuncioDocumenti | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generandoNumero, setGenerandoNumero] = useState(false)
  const [firma, setFirma] = useState<string | null>(null)
  const [padAperto, setPadAperto] = useState(false)
  const [modificaNumero, setModificaNumero] = useState(false)
  const [numeroInput, setNumeroInput] = useState('')
  const [tassoGlobale, setTassoGlobale] = useState<number>(7.9)
  const [archivio, setArchivio] = useState<DocumentoArchiviato[]>([])

  useEffect(() => {
    if (id) load(id)
    leggiImpostazioni().then((imp) => setTassoGlobale(imp.tasso_finanziamento_tan))
  }, [id])

  useEffect(() => {
    if (id) caricaArchivio(id)
  }, [id])

  async function caricaArchivio(annuncioId: string) {
    try {
      const lista = await listaDocumentiArchiviati(annuncioId)
      setArchivio(lista)
    } catch (err) {
      // Bucket/tabella non ancora creati su Supabase: l'archivio resta vuoto, non blocca il resto della pagina.
      console.error('Archivio documenti non disponibile', err)
    }
  }

  async function load(annuncioId: string) {
    setLoading(true)
    const { data } = await supabase.from('annunci').select('*').eq('id', annuncioId).single()
    if (data) setAnnuncio(data as AnnuncioDocumenti)
    setLoading(false)
  }

  function update<K extends keyof AnnuncioDocumenti>(field: K, value: AnnuncioDocumenti[K]) {
    setAnnuncio((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  function updateDotazione(campo: string, value: boolean) {
    setAnnuncio((prev) => (prev ? { ...prev, dotazioni: { ...(prev.dotazioni || {}), [campo]: value } } : prev))
  }

  function updateEsameTecnico(campo: string, value: string) {
    setAnnuncio((prev) => (prev ? { ...prev, esame_tecnico: { ...(prev.esame_tecnico || {}), [campo]: value } } : prev))
  }

  function updateConformita(campo: string, value: string) {
    setAnnuncio((prev) =>
      prev ? { ...prev, certificato_conformita: { ...(prev.certificato_conformita || {}), [campo]: value } } : prev
    )
  }

  // Assegna il numero contratto solo alla prima generazione di un documento reale
  // (non all'apertura pagina, non a un salvataggio bozza): evita buchi nella
  // numerazione progressiva se l'utente apre la pagina senza mai scaricare nulla.
  async function generaDocumento(fn: (a: AnnuncioDocumenti) => void, tipo: string) {
    if (!annuncio || !id) return

    let numero = annuncio.numero_contratto
    if (!numero) {
      setGenerandoNumero(true)
      try {
        numero = await generaNumeroContratto()
        await supabase.from('annunci').update({ numero_contratto: numero }).eq('id', id)
        setAnnuncio((prev) => (prev ? { ...prev, numero_contratto: numero } : prev))
      } catch (err) {
        console.error(err)
        alert(`Errore nella generazione del numero contratto, "${tipo}" non è stato creato. Riprova.`)
        setGenerandoNumero(false)
        return
      }
      setGenerandoNumero(false)
    }

    // La firma raccolta su tablet vale solo per questa generazione e non resta in memoria dopo
    impostaFirmaAcquirente(firma)
    try {
      fn({ ...annuncio, numero_contratto: numero, finanziamento_tan: tassoGlobale })
    } finally {
      impostaFirmaAcquirente(null)
    }
    // L'upload in archivio parte in background e non blocca il download: ricarico
    // la lista con un piccolo ritardo per dargli il tempo di completare.
    setTimeout(() => id && caricaArchivio(id), 2500)
  }

  async function salvaNumeroManuale() {
    if (!id) return
    const valore = numeroInput.trim() || null
    setSaving(true)
    await supabase.from('annunci').update({ numero_contratto: valore }).eq('id', id)
    setAnnuncio((prev) => (prev ? { ...prev, numero_contratto: valore } : prev))
    setSaving(false)
    setModificaNumero(false)
  }

  async function scaricaDaArchivio(doc: DocumentoArchiviato) {
    try {
      const url = await urlDownloadArchivio(doc.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      console.error(err)
      alert('Errore nel recupero del file. Riprova.')
    }
  }

  async function rimuoviDaArchivio(doc: DocumentoArchiviato) {
    const conferma = confirm(`Eliminare "${doc.nome_file}" dall'archivio? Non si può annullare.`)
    if (!conferma) return
    try {
      await eliminaDaArchivio(doc.id, doc.storage_path)
      setArchivio((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      console.error(err)
      alert("Errore nell'eliminazione. Riprova.")
    }
  }

  async function salva() {
    if (!annuncio || !id) return
    setSaving(true)

    const { id: _id, ...campiDaSalvare } = annuncio

    await supabase.from('annunci').update(campiDaSalvare).eq('id', id)
    setSaving(false)
  }

  // Azzera tutti i campi "documenti" (cliente, targa, checklist, permuta, ecc), utile dopo
  // aver compilato dati di prova. Non tocca marca/modello/prezzo/km/ecc dell'annuncio.
  async function resetta() {
    if (!annuncio || !id) return
    const conferma = confirm(
      'Sicuro di voler azzerare tutti i dati documenti (cliente, targa, checklist, permuta)? Non si può annullare.'
    )
    if (!conferma) return

    setSaving(true)

    const campiVuoti = {
      numero_contratto: null,
      targa: null, numero_telaio: null, provenienza: null, numero_proprietari: null,
      numero_mini_pass: null, ultima_manutenzione_km: null, ultima_manutenzione_data: null,
      scadenza_revisione: null, scadenza_bollo: null, km_alla_consegna: null,
      dotazioni: {}, esame_tecnico: {}, certificato_conformita: {}, prova_strada_acquirente: false,
      cliente_nome: null, cliente_cognome: null, cliente_data_nascita: null, cliente_luogo_nascita: null,
      cliente_indirizzo: null, cliente_cap: null, cliente_citta: null, cliente_provincia: null,
      cliente_cellulare: null, cliente_telefono: null, cliente_email: null, cliente_codice_fiscale: null,
      cliente_piva: null, cliente_professione: null,
      permuta_marca: null, permuta_modello: null, permuta_versione: null, permuta_targa: null,
      permuta_anno: null, permuta_km: null, permuta_valore: null, permuta_passaggio_proprieta_costo: null,
      permuta_cc: null, permuta_alimentazione: null, permuta_colore: null, permuta_numero_telaio: null,
      permuta_scadenza_revisione: null, permuta_numero_proprietari: null, permuta_immatricolazione_mese: null,
      permuta_ultima_manutenzione_km: null, permuta_ultima_manutenzione_data: null,
      permuta_scadenza_bollo: null, permuta_iva_tipo: null,
      prezzo_finale_vendita: null, garanzia_aggiuntiva_mesi: null, caparra_penitenziale: null,
      saldo_da_versare: null, richiesta_finanziamento: null, finanziamento_importo: null,
      finanziamento_rate: null, data_consegna_prevista: null, note_documento: null, modalita_pagamento: null,
    }

    await supabase.from('annunci').update(campiVuoti).eq('id', id)
    setAnnuncio((prev) => (prev ? { ...prev, ...campiVuoti } : prev))
    setSaving(false)
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-neutral-500">Caricamento...</p>
      </Layout>
    )
  }

  if (!annuncio) {
    return (
      <Layout>
        <p className="text-sm text-neutral-500">Annuncio non trovato.</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Torna indietro
      </button>

      <h1 className="font-display mb-1 text-2xl font-bold text-neutral-900">Documenti di Vendita</h1>
      <p className="mb-4 text-sm text-neutral-500">
        {annuncio.marca} {annuncio.versione || annuncio.modello}
      </p>

      <div className="mb-6 max-w-xs">
        <label className="field-label">Numero contratto</label>
        {modificaNumero ? (
          <div className="flex gap-2">
            <input
              className="field flex-1"
              value={numeroInput}
              onChange={(e) => setNumeroInput(e.target.value)}
              placeholder="es. 2026-014"
              autoFocus
            />
            <button
              onClick={salvaNumeroManuale}
              disabled={saving}
              className="btn-secondary px-3 text-xs"
            >
              Salva
            </button>
            <button onClick={() => setModificaNumero(false)} className="btn-secondary px-3 text-xs">
              Annulla
            </button>
          </div>
        ) : annuncio.numero_contratto ? (
          <div className="flex items-center gap-2">
            <div className="field flex-1 flex items-center font-bold text-neutral-900">{annuncio.numero_contratto}</div>
            <button
              onClick={() => {
                setNumeroInput(annuncio.numero_contratto || '')
                setModificaNumero(true)
              }}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
            >
              Modifica
            </button>
          </div>
        ) : (
          <div className="field flex items-center text-neutral-400">
            {generandoNumero ? 'Generazione...' : 'Verrà assegnato al primo documento generato'}
          </div>
        )}
        <p className="mt-1 text-[11px] text-neutral-500">
          {annuncio.numero_contratto
            ? 'Generato automaticamente (progressivo per anno). Modificabile solo per correzioni.'
            : 'Generato automaticamente al primo PDF che scarichi per questo annuncio, non a mano.'}
        </p>
      </div>

      {/* Dati veicolo: modificabili qui, utile per compilare un documento da zero senza partire da un annuncio */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-1 text-lg font-bold text-neutral-900">Dati Veicolo</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Precompilati se questo documento parte da un annuncio, ma puoi modificarli o compilarli da zero.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Marca</label>
            <input className="field" value={annuncio.marca || ''} onChange={(e) => update('marca', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Modello</label>
            <input className="field" value={annuncio.modello || ''} onChange={(e) => update('modello', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Versione</label>
            <input className="field" value={annuncio.versione || ''} onChange={(e) => update('versione', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Prezzo (€)</label>
            <input type="number" className="field" value={annuncio.prezzo ?? ''} onChange={(e) => update('prezzo', Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label">Km</label>
            <input type="number" className="field" value={annuncio.km ?? ''} onChange={(e) => update('km', Number(e.target.value))} />
          </div>
          <div>
            <label className="field-label">Alimentazione</label>
            <select className="field" value={annuncio.alimentazione || ''} onChange={(e) => update('alimentazione', e.target.value)}>
              <option value="">—</option>
              <option>Benzina</option>
              <option>Diesel</option>
              <option>GPL</option>
              <option>Metano</option>
              <option>Elettrica</option>
              <option>Ibrida</option>
            </select>
          </div>
          <div>
            <label className="field-label">Cambio</label>
            <select className="field" value={annuncio.cambio || ''} onChange={(e) => update('cambio', e.target.value)}>
              <option value="">—</option>
              <option>Manuale</option>
              <option>Automatico</option>
            </select>
          </div>
          <div>
            <label className="field-label">Colore</label>
            <input className="field" value={annuncio.colore || ''} onChange={(e) => update('colore', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Carrozzeria</label>
            <input className="field" value={annuncio.carrozzeria || ''} onChange={(e) => update('carrozzeria', e.target.value)} />
          </div>
          <div>
            <label className="field-label">CV</label>
            <input type="number" className="field" value={annuncio.cv ?? ''} onChange={(e) => update('cv', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Cilindrata (Cc)</label>
            <input type="number" className="field" value={annuncio.cilindrata_cc ?? ''} onChange={(e) => update('cilindrata_cc', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Condizione</label>
            <select className="field" value={annuncio.condizione || ''} onChange={(e) => update('condizione', e.target.value)}>
              <option value="">—</option>
              <option>Usato</option>
              <option>Nuovo</option>
              <option>Km0</option>
            </select>
          </div>
          <div>
            <label className="field-label">Mese immatricolazione</label>
            <input type="number" min={1} max={12} className="field" value={annuncio.immatricolazione_mese ?? ''} onChange={(e) => update('immatricolazione_mese', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Anno immatricolazione</label>
            <input type="number" className="field" value={annuncio.immatricolazione_anno ?? ''} onChange={(e) => update('immatricolazione_anno', e.target.value ? Number(e.target.value) : null)} />
          </div>
        </div>
      </div>

      {/* Download PDF */}
      <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900">
          <FileText className="h-5 w-5 text-brand" />
          Genera PDF
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Salva prima le eventuali modifiche qui sotto, poi scarica il documento che ti serve. I campi non compilati
          appaiono vuoti sul PDF: potrai completarli a penna in sede.
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2.5">
          <PenLine className="h-4 w-4 text-neutral-500" />
          <div className="min-w-0 flex-1 text-xs text-neutral-600">
            {firma ? 'Firma del cliente acquisita: comparirà nel Contratto di Vendita.' : 'Il cliente può firmare qui, sul tablet, e la firma finisce nel Contratto di Vendita.'}
          </div>
          {firma && <img src={firma} alt="Firma" className="h-9 rounded border border-neutral-200 bg-white px-1" />}
          <button className="btn-secondary !py-1.5 !text-xs" onClick={() => setPadAperto(true)}>
            {firma ? 'Rifai' : 'Raccogli firma'}
          </button>
          {firma && (
            <button className="text-xs font-semibold text-neutral-500 hover:text-red-600" onClick={() => setFirma(null)}>
              Rimuovi
            </button>
          )}
        </div>
        {padAperto && (
          <FirmaPad
            titolo="Firma dell'acquirente"
            onChiudi={() => setPadAperto(false)}
            onConferma={(png) => {
              setFirma(png)
              setPadAperto(false)
            }}
          />
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={() => generaDocumento(generaContrattoVendita, 'Contratto di Vendita')} disabled={generandoNumero} className="btn-secondary">
            <Download className="h-4 w-4" />
            Contratto di Vendita
          </button>
          <button onClick={() => generaDocumento(generaContrattoAcquisto, 'Contratto di Acquisto')} disabled={generandoNumero} className="btn-secondary">
            <Download className="h-4 w-4" />
            Contratto di Acquisto
          </button>
          <button onClick={() => generaDocumento(generaCertificatoConformita, 'Certificato di Conformità')} disabled={generandoNumero} className="btn-secondary">
            <Download className="h-4 w-4" />
            Certificato di Conformità
          </button>
          <button onClick={() => generaDocumento(generaSchedaPermuta, 'Scheda Permuta')} disabled={generandoNumero} className="btn-secondary">
            <Download className="h-4 w-4" />
            Scheda Permuta
          </button>
        </div>
      </div>

      {/* Archivio documenti già generati per questo annuncio */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-lg font-bold text-neutral-900">
            <Archive className="h-5 w-5 text-brand" />
            Archivio Documenti
          </h2>
          <button
            onClick={() => id && caricaArchivio(id)}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
            title="Aggiorna elenco"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {archivio.length === 0 ? (
          <p className="text-xs text-neutral-500">
            Nessun documento generato ancora per questo annuncio. Appena scarichi un PDF qui sopra, comparirà qui.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {archivio.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{doc.tipo_label}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {new Date(doc.creato_il).toLocaleString('it-IT')}
                    {doc.numero_contratto ? ` · Contratto N. ${doc.numero_contratto}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => scaricaDaArchivio(doc)} className="btn-secondary px-3 py-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Scarica
                  </button>
                  <button
                    onClick={() => rimuoviDaArchivio(doc)}
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    title="Elimina dall'archivio"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dati acquirente */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Dati Acquirente</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Nome</label>
            <input className="field" value={annuncio.cliente_nome || ''} onChange={(e) => update('cliente_nome', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Cognome</label>
            <input className="field" value={annuncio.cliente_cognome || ''} onChange={(e) => update('cliente_cognome', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Data di nascita</label>
            <input type="date" className="field" value={annuncio.cliente_data_nascita || ''} onChange={(e) => update('cliente_data_nascita', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Luogo di nascita</label>
            <input className="field" value={annuncio.cliente_luogo_nascita || ''} onChange={(e) => update('cliente_luogo_nascita', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Indirizzo</label>
            <input className="field" value={annuncio.cliente_indirizzo || ''} onChange={(e) => update('cliente_indirizzo', e.target.value)} />
          </div>
          <div>
            <label className="field-label">CAP</label>
            <input className="field" value={annuncio.cliente_cap || ''} onChange={(e) => update('cliente_cap', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Città</label>
            <input className="field" value={annuncio.cliente_citta || ''} onChange={(e) => update('cliente_citta', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Provincia</label>
            <input className="field" value={annuncio.cliente_provincia || ''} onChange={(e) => update('cliente_provincia', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Cellulare</label>
            <input className="field" value={annuncio.cliente_cellulare || ''} onChange={(e) => update('cliente_cellulare', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Telefono</label>
            <input className="field" value={annuncio.cliente_telefono || ''} onChange={(e) => update('cliente_telefono', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="field" value={annuncio.cliente_email || ''} onChange={(e) => update('cliente_email', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Codice Fiscale</label>
            <input className="field" value={annuncio.cliente_codice_fiscale || ''} onChange={(e) => update('cliente_codice_fiscale', e.target.value)} />
          </div>
          <div>
            <label className="field-label">P.IVA (se ditta)</label>
            <input className="field" value={annuncio.cliente_piva || ''} onChange={(e) => update('cliente_piva', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Professione</label>
            <input className="field" value={annuncio.cliente_professione || ''} onChange={(e) => update('cliente_professione', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Registrazione veicolo */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Dati di Registrazione Veicolo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Targa</label>
            <input className="field" value={annuncio.targa || ''} onChange={(e) => update('targa', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Numero Telaio</label>
            <input className="field" value={annuncio.numero_telaio || ''} onChange={(e) => update('numero_telaio', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Provenienza</label>
            <input className="field" placeholder="Privato, Permuta, Asta..." value={annuncio.provenienza || ''} onChange={(e) => update('provenienza', e.target.value)} />
          </div>
          <div>
            <label className="field-label">N° Proprietari</label>
            <input type="number" className="field" value={annuncio.numero_proprietari ?? ''} onChange={(e) => update('numero_proprietari', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">N° Mini Passaggi</label>
            <input type="number" className="field" value={annuncio.numero_mini_pass ?? ''} onChange={(e) => update('numero_mini_pass', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Km alla consegna</label>
            <input type="number" className="field" value={annuncio.km_alla_consegna ?? ''} onChange={(e) => update('km_alla_consegna', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Ultima manutenzione (km)</label>
            <input type="number" className="field" value={annuncio.ultima_manutenzione_km ?? ''} onChange={(e) => update('ultima_manutenzione_km', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Ultima manutenzione (data)</label>
            <input type="date" className="field" value={annuncio.ultima_manutenzione_data || ''} onChange={(e) => update('ultima_manutenzione_data', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Scadenza revisione</label>
            <input type="date" className="field" value={annuncio.scadenza_revisione || ''} onChange={(e) => update('scadenza_revisione', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Scadenza bollo</label>
            <input type="date" className="field" value={annuncio.scadenza_bollo || ''} onChange={(e) => update('scadenza_bollo', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Dotazioni */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Dotazioni e Documenti</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ['carnet_tagliandi', 'Carnet tagliandi'],
            ['tagliandi_regolari', 'Tagliandi regolari'],
            ['ruota_scorta', 'Ruota di scorta'],
            ['attrezzatura_emergenza', 'Attrezzatura emergenza'],
            ['chiavi_scorta', 'Chiavi di scorta'],
            ['carta_circolazione', 'Carta di circolazione'],
            ['libretto_circolazione', 'Libretto circolazione'],
            ['cdp', 'CdP'],
            ['iva', 'IVA (esposta in fattura)'],
          ].map(([campo, label]) => (
            <label key={campo} className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={Boolean(annuncio.dotazioni?.[campo as keyof typeof annuncio.dotazioni])}
                onChange={(e) => updateDotazione(campo, e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 bg-neutral-100 accent-brand"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={Boolean(annuncio.prova_strada_acquirente)}
            onChange={(e) => update('prova_strada_acquirente', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 bg-neutral-100 accent-brand"
          />
          Prova su strada effettuata dall'acquirente
        </div>

        <div className="mt-4">
          <label className="field-label">Note libere (compaiono su Contratto di Acquisto e Certificato di Conformità)</label>
          <textarea
            className="field"
            rows={3}
            placeholder="Eventuali annotazioni aggiuntive..."
            value={annuncio.note_documento || ''}
            onChange={(e) => update('note_documento', e.target.value)}
          />
        </div>
      </div>

      {/* Esame tecnico */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Esame Tecnico / Perizia</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ORGANI_ESAME_TECNICO.map(([chiave, label]) => (
            <div key={chiave} className="flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-500">{label}</span>
              <select
                className="field !w-40 !py-1.5 !text-xs"
                value={annuncio.esame_tecnico?.[chiave] || ''}
                onChange={(e) => updateEsameTecnico(chiave, e.target.value)}
              >
                <option value="">—</option>
                {VALORI_ESAME_TECNICO.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Certificato di conformità */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Certificato di Conformità (A / B / C)</h2>
        <p className="mb-4 text-xs text-neutral-500">
          A = conforme • B = conforme con usura normale • C = da ripristinare
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {ORGANI_CONFORMITA_FORM.map(([chiave, label]) => (
            <div key={chiave} className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-neutral-500">{label}</span>
              <select
                className="field !w-20 !py-1.5 !text-xs"
                value={annuncio.certificato_conformita?.[chiave] || ''}
                onChange={(e) => updateConformita(chiave, e.target.value)}
              >
                <option value="">—</option>
                {VALORI_CONFORMITA.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Permuta */}
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Veicolo in Permuta (eventuale)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Marca</label>
            <input className="field" value={annuncio.permuta_marca || ''} onChange={(e) => update('permuta_marca', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Modello</label>
            <input className="field" value={annuncio.permuta_modello || ''} onChange={(e) => update('permuta_modello', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Versione</label>
            <input className="field" value={annuncio.permuta_versione || ''} onChange={(e) => update('permuta_versione', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Targa</label>
            <input className="field" value={annuncio.permuta_targa || ''} onChange={(e) => update('permuta_targa', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Anno</label>
            <input type="number" className="field" value={annuncio.permuta_anno ?? ''} onChange={(e) => update('permuta_anno', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Km</label>
            <input type="number" className="field" value={annuncio.permuta_km ?? ''} onChange={(e) => update('permuta_km', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Valore riconosciuto (€)</label>
            <input type="number" className="field" value={annuncio.permuta_valore ?? ''} onChange={(e) => update('permuta_valore', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Passaggio proprietà (costo €)</label>
            <input type="number" className="field" value={annuncio.permuta_passaggio_proprieta_costo ?? ''} onChange={(e) => update('permuta_passaggio_proprieta_costo', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Cc (cilindrata)</label>
            <input type="number" className="field" value={annuncio.permuta_cc ?? ''} onChange={(e) => update('permuta_cc', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Alimentazione</label>
            <input className="field" value={annuncio.permuta_alimentazione || ''} onChange={(e) => update('permuta_alimentazione', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Colore</label>
            <input className="field" value={annuncio.permuta_colore || ''} onChange={(e) => update('permuta_colore', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Numero telaio</label>
            <input className="field" value={annuncio.permuta_numero_telaio || ''} onChange={(e) => update('permuta_numero_telaio', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="field-label">Scadenza revisione</label>
            <input type="date" className="field" value={annuncio.permuta_scadenza_revisione || ''} onChange={(e) => update('permuta_scadenza_revisione', e.target.value || null)} />
          </div>
          <div>
            <label className="field-label">N° proprietari</label>
            <input type="number" className="field" value={annuncio.permuta_numero_proprietari ?? ''} onChange={(e) => update('permuta_numero_proprietari', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Mese immatricolazione</label>
            <input type="number" min={1} max={12} className="field" value={annuncio.permuta_immatricolazione_mese ?? ''} onChange={(e) => update('permuta_immatricolazione_mese', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Ultima manutenzione (km)</label>
            <input type="number" className="field" value={annuncio.permuta_ultima_manutenzione_km ?? ''} onChange={(e) => update('permuta_ultima_manutenzione_km', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Ultima manutenzione (data)</label>
            <input type="date" className="field" value={annuncio.permuta_ultima_manutenzione_data || ''} onChange={(e) => update('permuta_ultima_manutenzione_data', e.target.value || null)} />
          </div>
          <div>
            <label className="field-label">Scadenza bollo</label>
            <input type="date" className="field" value={annuncio.permuta_scadenza_bollo || ''} onChange={(e) => update('permuta_scadenza_bollo', e.target.value || null)} />
          </div>
          <div>
            <label className="field-label">IVA</label>
            <select className="field" value={annuncio.permuta_iva_tipo || ''} onChange={(e) => update('permuta_iva_tipo', (e.target.value || null) as any)}>
              <option value="">Non specificato</option>
              <option value="totale">Totale</option>
              <option value="parziale">Parziale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Condizioni economiche vendita */}
      <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 text-lg font-bold text-neutral-900">Condizioni Economiche di Vendita</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Prezzo finale pattuito (€)</label>
            <input type="number" className="field" placeholder={String(annuncio.prezzo)} value={annuncio.prezzo_finale_vendita ?? ''} onChange={(e) => update('prezzo_finale_vendita', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Garanzia aggiuntiva (mesi)</label>
            <input type="number" className="field" value={annuncio.garanzia_aggiuntiva_mesi ?? ''} onChange={(e) => update('garanzia_aggiuntiva_mesi', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Caparra penitenziale (€)</label>
            <input type="number" className="field" value={annuncio.caparra_penitenziale ?? ''} onChange={(e) => update('caparra_penitenziale', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Saldo da versare (€)</label>
            <input type="number" className="field" value={annuncio.saldo_da_versare ?? ''} onChange={(e) => update('saldo_da_versare', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="field-label">Metodo di pagamento</label>
            <select className="field" value={annuncio.modalita_pagamento || ''} onChange={(e) => update('modalita_pagamento', e.target.value)}>
              <option value="">Seleziona</option>
              <option value="Contanti">Contanti</option>
              <option value="Bonifico">Bonifico</option>
              <option value="POS">POS</option>
              <option value="Assegno">Assegno</option>
            </select>
          </div>
          <div>
            <label className="field-label">Richiesta finanziamento</label>
            <select className="field" value={annuncio.richiesta_finanziamento || ''} onChange={(e) => update('richiesta_finanziamento', e.target.value)}>
              <option value="">Nessuno</option>
              <option value="Leasing">Leasing</option>
              <option value="Finanziamento">Finanziamento</option>
            </select>
          </div>
          <div>
            <label className="field-label">Data consegna prevista</label>
            <input type="date" className="field" value={annuncio.data_consegna_prevista || ''} onChange={(e) => update('data_consegna_prevista', e.target.value)} />
          </div>

          {annuncio.richiesta_finanziamento && annuncio.richiesta_finanziamento !== '' && (
            <>
              <div>
                <label className="field-label">Importo finanziato (€)</label>
                <input
                  type="number"
                  className="field"
                  placeholder={String(annuncio.prezzo_finale_vendita ?? annuncio.prezzo)}
                  value={annuncio.finanziamento_importo ?? ''}
                  onChange={(e) => update('finanziamento_importo', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="field-label">N° rate mensili</label>
                <input
                  type="number"
                  className="field"
                  placeholder="es. 36"
                  value={annuncio.finanziamento_rate ?? ''}
                  onChange={(e) => update('finanziamento_rate', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="field-label">TAN applicato (impostazione generale)</label>
                <div className="field flex items-center text-neutral-500">
                  {tassoGlobale}% — <a href="/impostazioni" className="ml-1 text-brand hover:underline">modifica</a>
                </div>
              </div>
              <div>
                <label className="field-label">Rata mensile (calcolata)</label>
                <div className="field flex items-center text-brand font-bold">
                  {annuncio.finanziamento_importo && annuncio.finanziamento_rate
                    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                        calcolaRataMensile(annuncio.finanziamento_importo, tassoGlobale, annuncio.finanziamento_rate)
                      ) + ' / mese'
                    : '—'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={salva} disabled={saving} className="btn-primary">
          {saving ? 'Salvataggio...' : 'Salva dati'}
        </button>
        <button onClick={resetta} disabled={saving} className="btn-secondary">
          Resetta tutti i campi
        </button>
      </div>
    </Layout>
  )
}