import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useUtente, nomeCompleto } from '../lib/utente'
import { CANALI, PROVINCE_VENETO } from '../lib/vendite'

interface Props {
  annuncioId: string
  titolo: string
  onClose: () => void
  onSaved: () => void
}

/**
 * Scheda "Registra vendita": data, prezzo reale, commerciale, canale e dati
 * essenziali del cliente. Sono i dati che alimentano la dashboard Vendite
 * e le Scadenze (garanzia, richiamo tagliando).
 */
export function VenditaModal({ annuncioId, titolo, onClose, onSaved }: Props) {
  const { commerciali, commercialeAttivo, isTitolare } = useUtente()
  const [f, setF] = useState({
    venduto_il: new Date().toISOString().slice(0, 10),
    prezzo_finale_vendita: '',
    prezzo_acquisto: '',
    costi_ripristino: '',
    commerciale_id: commercialeAttivo?.id ?? '',
    canale_vendita: '',
    cliente_nome: '',
    cliente_cognome: '',
    cliente_cellulare: '',
    cliente_citta: '',
    cliente_provincia: '',
    garanzia_aggiuntiva_mesi: '0',
  })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('annunci')
      .select('prezzo, prezzo_finale_vendita, prezzo_acquisto, costi_ripristino, venduto_il, commerciale_id, canale_vendita, cliente_nome, cliente_cognome, cliente_cellulare, cliente_citta, cliente_provincia, garanzia_aggiuntiva_mesi')
      .eq('id', annuncioId)
      .single()
      .then(({ data: d }) => {
        if (!d) return
        setF((x) => ({
          ...x,
          venduto_il: d.venduto_il ?? x.venduto_il,
          prezzo_finale_vendita: String(d.prezzo_finale_vendita ?? d.prezzo ?? ''),
          prezzo_acquisto: d.prezzo_acquisto == null ? '' : String(d.prezzo_acquisto),
          costi_ripristino: d.costi_ripristino == null ? '' : String(d.costi_ripristino),
          commerciale_id: d.commerciale_id ?? x.commerciale_id,
          canale_vendita: d.canale_vendita ?? '',
          cliente_nome: d.cliente_nome ?? '',
          cliente_cognome: d.cliente_cognome ?? '',
          cliente_cellulare: d.cliente_cellulare ?? '',
          cliente_citta: d.cliente_citta ?? '',
          cliente_provincia: d.cliente_provincia ?? '',
          garanzia_aggiuntiva_mesi: String(d.garanzia_aggiuntiva_mesi ?? 0),
        }))
      })
  }, [annuncioId])

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }))
  const num = (s: string) => (s === '' ? null : Number(s))

  async function salva() {
    if (!f.venduto_il || !f.prezzo_finale_vendita) {
      setErrore('Data e prezzo di vendita sono obbligatori')
      return
    }
    setSaving(true)
    const payload: Record<string, unknown> = {
      stato_pubblicazione: 'venduto',
      venduto_il: f.venduto_il,
      prezzo_finale_vendita: num(f.prezzo_finale_vendita),
      commerciale_id: f.commerciale_id || null,
      canale_vendita: f.canale_vendita || null,
      cliente_nome: f.cliente_nome || null,
      cliente_cognome: f.cliente_cognome || null,
      cliente_cellulare: f.cliente_cellulare || null,
      cliente_citta: f.cliente_citta || null,
      cliente_provincia: f.cliente_provincia.toUpperCase() || null,
      garanzia_aggiuntiva_mesi: Number(f.garanzia_aggiuntiva_mesi) || 0,
    }
    // prezzo di acquisto e costi li tocca solo il titolare
    if (isTitolare) {
      payload.prezzo_acquisto = num(f.prezzo_acquisto)
      payload.costi_ripristino = num(f.costi_ripristino)
    }
    const { error } = await supabase.from('annunci').update(payload).eq('id', annuncioId)
    setSaving(false)
    if (error) setErrore('Errore nel salvataggio, riprova')
    else onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-neutral-900">Registra vendita</h2>
            <p className="text-sm text-neutral-500">{titolo}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Data vendita *</label>
            <input type="date" className="field" value={f.venduto_il} onChange={(e) => set('venduto_il', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Prezzo di vendita (€) *</label>
            <input type="number" className="field" value={f.prezzo_finale_vendita} onChange={(e) => set('prezzo_finale_vendita', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Commerciale</label>
            <select
              className="field"
              value={f.commerciale_id}
              disabled={!isTitolare}
              onChange={(e) => set('commerciale_id', e.target.value)}
            >
              <option value="">Non assegnato</option>
              {commerciali.filter((c) => c.attivo).map((c) => (
                <option key={c.id} value={c.id}>{nomeCompleto(c)}{c.ruolo === 'titolare' ? ' (titolare)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Canale di provenienza</label>
            <select className="field" value={f.canale_vendita} onChange={(e) => set('canale_vendita', e.target.value)}>
              <option value="">Non indicato</option>
              {CANALI.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {isTitolare && (
            <>
              <div>
                <label className="field-label">Prezzo di acquisto (€)</label>
                <input type="number" className="field" placeholder="Per calcolare il margine" value={f.prezzo_acquisto} onChange={(e) => set('prezzo_acquisto', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Costi di ripristino (€)</label>
                <input type="number" className="field" placeholder="Meccanica, carrozzeria, pulizia" value={f.costi_ripristino} onChange={(e) => set('costi_ripristino', e.target.value)} />
              </div>
            </>
          )}
        </div>

        <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-neutral-500">Cliente</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Nome</label>
            <input className="field" value={f.cliente_nome} onChange={(e) => set('cliente_nome', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Cognome</label>
            <input className="field" value={f.cliente_cognome} onChange={(e) => set('cliente_cognome', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Cellulare</label>
            <input className="field" value={f.cliente_cellulare} onChange={(e) => set('cliente_cellulare', e.target.value)} />
          </div>
          <div className="grid grid-cols-[1fr_88px] gap-3">
            <div>
              <label className="field-label">Comune</label>
              <input className="field" value={f.cliente_citta} onChange={(e) => set('cliente_citta', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Prov.</label>
              <input className="field uppercase" maxLength={2} list="province" value={f.cliente_provincia} onChange={(e) => set('cliente_provincia', e.target.value)} />
              <datalist id="province">
                {PROVINCE_VENETO.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="field-label">Garanzia aggiuntiva</label>
            <select className="field" value={f.garanzia_aggiuntiva_mesi} onChange={(e) => set('garanzia_aggiuntiva_mesi', e.target.value)}>
              <option value="0">Nessuna (solo 12 mesi di legge)</option>
              <option value="12">+12 mesi</option>
              <option value="24">+24 mesi</option>
            </select>
          </div>
        </div>

        {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Annulla</button>
          <button onClick={salva} disabled={saving} className="btn-primary">
            {saving ? 'Salvataggio...' : 'Segna come venduta'}
          </button>
        </div>
      </div>
    </div>
  )
}
