import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, FileSpreadsheet, Upload, AlertTriangle, Check } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Pannello } from '../components/Grafici'
import { supabase } from '../lib/supabaseClient'
import { CAMPI, CampoId, indovinaMappa, parseCsv, preparaRiga, scaricaCsv, templateCsv } from '../lib/csv'

type Fase = 'scelta' | 'mappa' | 'fatto'

export function ImportaAnnunci() {
  const [fase, setFase] = useState<Fase>('scelta')
  const [righe, setRighe] = useState<string[][]>([])
  const [mappa, setMappa] = useState<Record<CampoId, number> | null>(null)
  const [nomeFile, setNomeFile] = useState('')
  const [errore, setErrore] = useState('')
  const [targheEsistenti, setTargheEsistenti] = useState<Set<string>>(new Set())
  const [saltaDuplicati, setSaltaDuplicati] = useState(true)
  const [importando, setImportando] = useState(false)
  const [risultato, setRisultato] = useState<{ ok: number; saltate: number; errori: number } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const intestazioni = righe[0] ?? []
  const corpo = useMemo(() => righe.slice(1), [righe])

  async function leggiFile(file: File) {
    setErrore('')
    try {
      const r = parseCsv(await file.text())
      if (r.length < 2) {
        setErrore('Il file è vuoto o ha solo l’intestazione. Controlla di averlo salvato in formato CSV.')
        return
      }
      if (r.length > 2001) {
        setErrore('Il file ha più di 2.000 righe: dividilo in più parti.')
        return
      }
      const { data } = await supabase.from('annunci').select('targa')
      setTargheEsistenti(new Set(((data as { targa: string | null }[]) ?? []).map((x) => (x.targa ?? '').toUpperCase().replace(/\s/g, '')).filter(Boolean)))
      setRighe(r)
      setMappa(indovinaMappa(r[0]))
      setNomeFile(file.name)
      setFase('mappa')
    } catch {
      setErrore('Non riesco a leggere il file. Esporta di nuovo da Excel come "CSV (con separatore punto e virgola)".')
    }
  }

  const pronte = useMemo(
    () => (mappa ? corpo.map((v, i) => preparaRiga(v, mappa, i + 2)) : []),
    [corpo, mappa]
  )

  const stato = useMemo(() => {
    const viste = new Set<string>()
    return pronte.map((r) => {
      const t = String(r.dati.targa ?? '')
      const dup = t !== '' && (targheEsistenti.has(t) || viste.has(t))
      if (t) viste.add(t)
      return { ...r, duplicata: dup }
    })
  }, [pronte, targheEsistenti])

  const valide = stato.filter((r) => r.errori.length === 0 && !(saltaDuplicati && r.duplicata))
  const conErrori = stato.filter((r) => r.errori.length > 0)
  const duplicate = stato.filter((r) => r.errori.length === 0 && r.duplicata)
  const mancanti = CAMPI.filter((c) => c.obbligatorio && (mappa?.[c.id] ?? -1) < 0)

  async function importa() {
    setImportando(true)
    let ok = 0
    const lotti: Record<string, string | number | null>[][] = []
    const dati = valide.map((r) => ({ ...r.dati, stato_pubblicazione: 'bozza' }))
    for (let i = 0; i < dati.length; i += 100) lotti.push(dati.slice(i, i + 100))
    let errori = conErrori.length
    for (const l of lotti) {
      const { error } = await supabase.from('annunci').insert(l)
      if (error) errori += l.length
      else ok += l.length
    }
    setRisultato({ ok, saltate: saltaDuplicati ? duplicate.length : 0, errori })
    setImportando(false)
    setFase('fatto')
  }

  return (
    <Layout>
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Annunci
      </Link>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900">Importa il parco auto</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Hai già l’elenco delle auto in Excel o nel vecchio gestionale? Caricalo qui: le auto arrivano come bozze, le foto le aggiungi dopo.
        </p>
      </div>

      {fase === 'scelta' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Pannello titolo="1. Carica il file" sottotitolo="CSV da Excel, Google Fogli o dal vecchio gestionale">
            <input
              ref={input}
              type="file"
              accept=".csv,.txt,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && leggiFile(e.target.files[0])}
            />
            <button
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files[0]) leggiFile(e.dataTransfer.files[0])
              }}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 px-4 py-10 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm font-semibold">Scegli un file CSV o trascinalo qui</span>
              <span className="text-xs">Fino a 2.000 auto per volta</span>
            </button>
            {errore && <p className="mt-3 text-xs font-semibold text-red-600">{errore}</p>}
          </Pannello>

          <Pannello titolo="Non sai come prepararlo?" sottotitolo="Scarica il modello e incolla le tue auto">
            <button
              className="btn-secondary"
              onClick={() => scaricaCsv('modello-import-auto.csv', templateCsv())}
            >
              <Download className="h-4 w-4" /> Scarica il modello CSV
            </button>
            <ul className="mt-4 space-y-1.5 text-xs text-neutral-500">
              <li>Obbligatori solo marca, modello e prezzo.</li>
              <li>Se le colonne hanno nomi diversi (Carburante, Chilometri...) le riconosco da solo, e puoi correggerle al passo dopo.</li>
              <li>Le targhe già presenti non vengono duplicate.</li>
              <li>Prima di importare vedi l’anteprima con eventuali errori.</li>
            </ul>
          </Pannello>
        </div>
      )}

      {fase === 'mappa' && mappa && (
        <div className="space-y-4">
          <Pannello
            titolo="2. Controlla le colonne"
            sottotitolo={`${nomeFile} · ${corpo.length} righe lette`}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPI.map((c) => (
                <div key={c.id}>
                  <label className="field-label">
                    {c.etichetta}
                    {c.obbligatorio && <span className="text-brand"> *</span>}
                  </label>
                  <select
                    className="field !py-2 !text-xs"
                    value={mappa[c.id]}
                    onChange={(e) => setMappa({ ...mappa, [c.id]: Number(e.target.value) })}
                  >
                    <option value={-1}>(non importare)</option>
                    {intestazioni.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Colonna ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {mancanti.length > 0 && (
              <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" /> Associa una colonna a: {mancanti.map((m) => m.etichetta).join(', ')}
              </p>
            )}
          </Pannello>

          <Pannello titolo="3. Anteprima" sottotitolo="Prime righe come verranno importate">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="py-2 pr-3">Riga</th>
                    <th className="py-2 pr-3">Auto</th>
                    <th className="py-2 pr-3">Anno</th>
                    <th className="py-2 pr-3">Km</th>
                    <th className="py-2 pr-3">Prezzo</th>
                    <th className="py-2 pr-3">Targa</th>
                    <th className="py-2">Esito</th>
                  </tr>
                </thead>
                <tbody>
                  {stato.slice(0, 15).map((r) => (
                    <tr key={r.riga} className="border-b border-neutral-100 align-top">
                      <td className="py-2 pr-3 text-neutral-500">{r.riga}</td>
                      <td className="py-2 pr-3 font-semibold text-neutral-900">
                        {r.dati.marca} {r.dati.modello} <span className="font-normal text-neutral-500">{r.dati.versione}</span>
                      </td>
                      <td className="py-2 pr-3">{r.dati.immatricolazione_anno ?? '-'}</td>
                      <td className="py-2 pr-3">{Number(r.dati.km).toLocaleString('it-IT')}</td>
                      <td className="py-2 pr-3">{Number(r.dati.prezzo).toLocaleString('it-IT')} €</td>
                      <td className="py-2 pr-3">{r.dati.targa ?? '-'}</td>
                      <td className="py-2">
                        {r.errori.length > 0 ? (
                          <span className="font-semibold text-red-600">{r.errori.join(', ')}</span>
                        ) : r.duplicata ? (
                          <span className="font-semibold text-amber-600">Targa già presente</span>
                        ) : r.avvisi.length > 0 ? (
                          <span className="text-amber-600">{r.avvisi[0]}</span>
                        ) : (
                          <span className="text-emerald-600">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stato.length > 15 && <p className="mt-2 text-xs text-neutral-500">… e altre {stato.length - 15} righe</p>}
          </Pannello>

          <div className="flex flex-wrap items-center gap-4">
            <button className="btn-primary" disabled={importando || mancanti.length > 0 || valide.length === 0} onClick={importa}>
              <FileSpreadsheet className="h-4 w-4" />
              {importando ? 'Importazione...' : `Importa ${valide.length} auto`}
            </button>
            <button className="btn-secondary" onClick={() => { setFase('scelta'); setRighe([]) }}>
              Cambia file
            </button>
            {duplicate.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-neutral-600">
                <input type="checkbox" checked={saltaDuplicati} onChange={(e) => setSaltaDuplicati(e.target.checked)} />
                Salta le {duplicate.length} targhe già presenti
              </label>
            )}
            {conErrori.length > 0 && (
              <span className="text-xs font-semibold text-red-600">{conErrori.length} {conErrori.length === 1 ? "riga con errori verrà esclusa" : "righe con errori verranno escluse"}</span>
            )}
          </div>
        </div>
      )}

      {fase === 'fatto' && risultato && (
        <Pannello titolo="Importazione completata">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <Check className="h-4 w-4" /> {risultato.ok} auto importate come bozze
          </p>
          {(risultato.saltate > 0 || risultato.errori > 0) && (
            <p className="mt-1 text-xs text-neutral-500">
              {risultato.saltate > 0 && `${risultato.saltate} saltate perché già presenti. `}
              {risultato.errori > 0 && `${risultato.errori} non importate per errori.`}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <Link to="/" className="btn-primary">Vai agli annunci</Link>
            <button className="btn-secondary" onClick={() => { setFase('scelta'); setRighe([]); setRisultato(null) }}>
              Importa un altro file
            </button>
          </div>
        </Pannello>
      )}
    </Layout>
  )
}
