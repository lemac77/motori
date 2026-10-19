import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { Layout } from '../components/Layout'
import { GestioneTeam } from '../components/GestioneTeam'
import { leggiImpostazioni, salvaImpostazioni, type ImpostazioniGenerali } from '../lib/impostazioni'

export function Impostazioni() {
  const [valori, setValori] = useState<ImpostazioniGenerali | null>(null)
  const [saving, setSaving] = useState(false)
  const [salvato, setSalvato] = useState(false)

  useEffect(() => {
    leggiImpostazioni().then(setValori)
  }, [])

  function update<K extends keyof ImpostazioniGenerali>(campo: K, valore: number) {
    setValori((prev) => (prev ? { ...prev, [campo]: valore } : prev))
    setSalvato(false)
  }

  async function salva() {
    if (!valori) return
    setSaving(true)
    await salvaImpostazioni(valori)
    setSaving(false)
    setSalvato(true)
  }

  if (!valori) {
    return (
      <Layout>
        <p className="text-sm text-neutral-500">Caricamento...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <h1 className="font-display mb-1 text-2xl font-bold text-neutral-900">Impostazioni</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Valori validi per tutte le auto: alimentano il simulatore rate sul sito e i documenti di vendita.
      </p>

      <div className="max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Settings className="h-5 w-5 text-brand" />
          Condizioni Finanziamento
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">TAN — Tasso Annuo Nominale (%)</label>
            <input
              type="number"
              step="0.01"
              className="field"
              value={valori.tasso_finanziamento_tan}
              onChange={(e) => update('tasso_finanziamento_tan', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="field-label">Spese di istruttoria (€)</label>
            <input
              type="number"
              step="1"
              className="field"
              value={valori.spese_istruttoria}
              onChange={(e) => update('spese_istruttoria', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="field-label">TAEG con assicurazione (%)</label>
            <input
              type="number"
              step="0.01"
              className="field"
              value={valori.taeg_con_assicurazione}
              onChange={(e) => update('taeg_con_assicurazione', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="field-label">TAEG senza assicurazione (%)</label>
            <input
              type="number"
              step="0.01"
              className="field"
              value={valori.taeg_senza_assicurazione}
              onChange={(e) => update('taeg_senza_assicurazione', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="field-label">Spese incasso rata (€)</label>
            <input
              type="number"
              step="0.01"
              className="field"
              value={valori.spese_incasso_rata}
              onChange={(e) => update('spese_incasso_rata', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="field-label">Premio assicurativo (% dell'importo finanziato)</label>
            <input
              type="number"
              step="0.0001"
              className="field"
              value={valori.rapporto_assicurazione}
              onChange={(e) => update('rapporto_assicurazione', Number(e.target.value))}
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Es. 0.2227 = il premio assicurativo costa il 22,27% dell'importo finanziato.
            </p>
          </div>
        </div>

        <button onClick={salva} disabled={saving} className="btn-primary mt-6">
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
        {salvato && <span className="ml-3 text-sm font-semibold text-emerald-600">Salvato</span>}
      </div>

      <div className="mt-6 max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Settings className="h-5 w-5 text-brand" />
          Numerazione Documenti
        </h2>

        <div className="max-w-xs">
          <label className="field-label">Prossimo numero da assegnare</label>
          <input
            type="number"
            step="1"
            min={1}
            className="field"
            value={valori.prossimo_numero_progressivo}
            onChange={(e) => update('prossimo_numero_progressivo', Number(e.target.value))}
          />
          <p className="mt-1 text-[11px] text-neutral-500">
            Il prossimo contratto generato avrà come numero <strong>{new Date().getFullYear()}-{String(valori.prossimo_numero_progressivo).padStart(3, '0')}</strong>,
            poi il contatore sale da solo ad ogni generazione. Cambialo solo se devi allineare la numerazione a qualcosa di già iniziato altrove.
          </p>
        </div>

        <button onClick={salva} disabled={saving} className="btn-primary mt-6">
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
        {salvato && <span className="ml-3 text-sm font-semibold text-emerald-600">Salvato</span>}
      </div>
      <GestioneTeam />
    </Layout>
  )
}