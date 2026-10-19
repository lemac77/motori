import { useEffect, useState } from 'react'
import { X, Phone, Mail, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useUtente, nomeCompleto } from '../lib/utente'
import {
  Attivita, FONTI, STADI, TIPI_ATTIVITA, Trattativa, Stadio,
  aperta, etichettaStadio, fa, infoRichiamo, oggiISO, traGiorni,
} from '../lib/crm'

interface Props {
  trattativa: Trattativa
  onClose: () => void
  /** applica le modifiche alla lista della pagina */
  onChange: (id: string, campi: Partial<Trattativa>) => void
}

const RAPIDI = [
  { l: 'Oggi', g: 0 },
  { l: 'Domani', g: 1 },
  { l: '+3 giorni', g: 3 },
  { l: '+1 settimana', g: 7 },
]

export function TrattativaDrawer({ trattativa: t, onClose, onChange }: Props) {
  const { isTitolare, commercialeAttivo, commerciali } = useUtente()
  const [attivita, setAttivita] = useState<Attivita[] | null>(null)
  const [tipo, setTipo] = useState<(typeof TIPI_ATTIVITA)[number]['v']>('chiamata')
  const [testo, setTesto] = useState('')
  const attivi = commerciali.filter((c) => c.attivo && c.ruolo === 'commerciale')
  const autore = commercialeAttivo ? nomeCompleto(commercialeAttivo) : 'Titolare'
  const richiamo = infoRichiamo(aperta(t.stato) ? t.richiamo_il : null)

  async function caricaAttivita() {
    const { data } = await supabase.from('trattative_attivita').select('*').eq('trattativa_id', t.id).order('creato_il', { ascending: false })
    setAttivita((data as Attivita[]) ?? [])
  }
  useEffect(() => {
    caricaAttivita()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id])

  async function logga(tipoAtt: Attivita['tipo'], txt: string) {
    const riga = { trattativa_id: t.id, tipo: tipoAtt, testo: txt, autore }
    const { data } = await supabase.from('trattative_attivita').insert(riga).select().single()
    if (data) setAttivita((a) => [data as Attivita, ...(a ?? [])])
  }

  async function salva(campi: Partial<Trattativa>) {
    const extra = { aggiornato_il: new Date().toISOString() }
    onChange(t.id, { ...campi, ...extra })
    await supabase.from('trattative').update({ ...campi, ...extra }).eq('id', t.id)
  }

  async function cambiaStadio(nuovo: Stadio) {
    if (nuovo === t.stato) return
    const chiusa = !aperta(nuovo)
    await salva({
      stato: nuovo,
      chiuso_il: chiusa ? new Date().toISOString() : null,
      ...(chiusa ? { richiamo_il: null, prossima_azione: null } : {}),
      ...(nuovo !== 'perso' ? { motivo_perso: null } : {}),
    })
    await logga('stadio', `Da ${etichettaStadio(t.stato)} a ${etichettaStadio(nuovo)}`)
  }

  async function aggiungi() {
    if (!testo.trim()) return
    await logga(tipo, testo.trim())
    setTesto('')
    await salva({})
  }

  async function fattoERipianifica(g: number | null) {
    const fatta = t.prossima_azione ? `Fatto: ${t.prossima_azione}` : 'Azione completata'
    await logga('nota', fatta)
    await salva({ richiamo_il: g == null ? null : traGiorni(g), prossima_azione: g == null ? null : t.prossima_azione })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-xl sm:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-200 bg-white p-5">
          <div className="min-w-0">
            <h2 className="font-display truncate text-lg font-bold text-neutral-900">{t.nome}</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Creata {fa(t.creato_il)} · {t.fonte}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {t.telefono && (
                <a href={`tel:${t.telefono.replace(/\s/g, '')}`} className="flex items-center gap-1 text-neutral-700 hover:text-brand">
                  <Phone className="h-3 w-3" /> {t.telefono}
                </a>
              )}
              {t.email && (
                <a href={`mailto:${t.email}`} className="flex items-center gap-1 text-neutral-700 hover:text-brand">
                  <Mail className="h-3 w-3" /> {t.email}
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900" aria-label="Chiudi">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5">
          {/* Fase */}
          <div>
            <label className="field-label">Fase</label>
            <div className="flex flex-wrap gap-1.5">
              {STADI.map((s) => (
                <button
                  key={s.v}
                  onClick={() => cambiaStadio(s.v)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    t.stato === s.v ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${t.stato === s.v ? 'bg-white' : s.punto}`} />
                  {s.l}
                </button>
              ))}
            </div>
            {t.stato === 'perso' && (
              <input
                className="field mt-3 !text-xs"
                placeholder="Perché l'abbiamo perso? (es. ha comprato altrove, prezzo)"
                defaultValue={t.motivo_perso ?? ''}
                onBlur={(e) => e.target.value !== (t.motivo_perso ?? '') && salva({ motivo_perso: e.target.value || null })}
              />
            )}
          </div>

          {/* Prossima azione */}
          {aperta(t.stato) && (
            <div className={`rounded-xl border p-4 ${richiamo?.tono === 'rosso' ? 'border-red-300 bg-red-50' : richiamo?.tono === 'arancio' ? 'border-brand/40 bg-brand/10' : 'border-neutral-200'}`}>
              <label className="field-label">Prossima azione</label>
              <input
                className="field"
                placeholder="Es. richiamare per il preventivo"
                defaultValue={t.prossima_azione ?? ''}
                key={t.prossima_azione ?? ''}
                onBlur={(e) => e.target.value !== (t.prossima_azione ?? '') && salva({ prossima_azione: e.target.value || null })}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  className="field !w-auto !py-1.5 !text-xs"
                  value={t.richiamo_il ?? ''}
                  min={oggiISO()}
                  onChange={(e) => salva({ richiamo_il: e.target.value || null })}
                />
                {richiamo && (
                  <span className={`text-xs font-semibold ${richiamo.tono === 'rosso' ? 'text-red-600' : richiamo.tono === 'arancio' ? 'text-brand' : 'text-neutral-500'}`}>
                    {richiamo.testo}
                  </span>
                )}
              </div>
              <div className="mt-3 border-t border-neutral-200 pt-3">
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-neutral-700">
                  <Check className="h-3.5 w-3.5" /> Fatto. Quando lo richiamo?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {RAPIDI.map((r) => (
                    <button key={r.l} className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => fattoERipianifica(r.g)}>{r.l}</button>
                  ))}
                  <button className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => fattoERipianifica(null)}>Nessun richiamo</button>
                </div>
              </div>
            </div>
          )}

          {/* Dati */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="field-label">Auto di interesse</label>
              <input className="field" defaultValue={t.auto_interesse ?? ''} onBlur={(e) => e.target.value !== (t.auto_interesse ?? '') && salva({ auto_interesse: e.target.value || null })} />
            </div>
            <div>
              <label className="field-label">Valore stimato (€)</label>
              <input type="number" className="field" defaultValue={t.valore ?? ''} onBlur={(e) => salva({ valore: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <label className="field-label">Provenienza</label>
              <select className="field" value={t.fonte} onChange={(e) => salva({ fonte: e.target.value })}>
                {FONTI.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Telefono</label>
              <input className="field" defaultValue={t.telefono ?? ''} onBlur={(e) => e.target.value !== (t.telefono ?? '') && salva({ telefono: e.target.value || null })} />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input className="field" defaultValue={t.email ?? ''} onBlur={(e) => e.target.value !== (t.email ?? '') && salva({ email: e.target.value || null })} />
            </div>
            {isTitolare && (
              <div className="sm:col-span-2">
                <label className="field-label">Commerciale</label>
                <select className="field" value={t.commerciale_id ?? ''} onChange={(e) => salva({ commerciale_id: e.target.value || null })}>
                  <option value="">Non assegnata</option>
                  {attivi.map((c) => <option key={c.id} value={c.id}>{nomeCompleto(c)}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Storico */}
          <div>
            <label className="field-label">Storico</label>
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="flex flex-wrap gap-1.5">
                {TIPI_ATTIVITA.map((x) => (
                  <button
                    key={x.v}
                    onClick={() => setTipo(x.v)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tipo === x.v ? 'border-brand text-brand' : 'border-neutral-200 text-neutral-500'}`}
                  >
                    {x.l}
                  </button>
                ))}
              </div>
              <textarea className="field mt-2 !text-xs" rows={2} placeholder="Cosa vi siete detti?" value={testo} onChange={(e) => setTesto(e.target.value)} />
              <button className="btn-primary mt-2 !px-3 !py-1.5 !text-xs" onClick={aggiungi} disabled={!testo.trim()}>Aggiungi allo storico</button>
            </div>

            <ol className="mt-4 flex flex-col gap-3 border-l border-neutral-200 pl-4">
              {!attivita ? (
                <li className="text-xs text-neutral-500">Caricamento...</li>
              ) : attivita.length === 0 ? (
                <li className="text-xs text-neutral-500">Ancora nessuna attività.</li>
              ) : (
                attivita.map((a) => (
                  <li key={a.id} className="relative text-xs">
                    <span className={`absolute -left-[21px] top-1 h-2 w-2 rounded-full ${a.tipo === 'stadio' ? 'bg-neutral-400' : 'bg-brand'}`} />
                    <p className="text-neutral-500">
                      <span className="font-semibold text-neutral-700">{a.tipo === 'stadio' ? 'Fase' : TIPI_ATTIVITA.find((x) => x.v === a.tipo)?.l}</span>
                      {' · '}{a.autore ?? ''}{a.autore ? ' · ' : ''}{fa(a.creato_il)}
                    </p>
                    <p className="mt-0.5 text-neutral-900">{a.testo}</p>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  )
}
