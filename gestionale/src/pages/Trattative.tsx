import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Phone, CalendarClock, X } from 'lucide-react'
import { Layout } from '../components/Layout'
import { StatTile } from '../components/Grafici'
import { TrattativaDrawer } from '../components/TrattativaDrawer'
import { supabase } from '../lib/supabaseClient'
import { useUtente, nomeCompleto } from '../lib/utente'
import { FONTI, STADI, Stadio, Trattativa, aperta, euro, infoRichiamo, oggiISO } from '../lib/crm'

export function Trattative() {
  const { isTitolare, commercialeAttivo, commerciali } = useUtente()
  const [params, setParams] = useSearchParams()
  const [righe, setRighe] = useState<Trattativa[] | null>(null)
  const [aperto, setAperto] = useState<string | null>(params.get('apri'))
  const [nuova, setNuova] = useState(false)
  const [soloRichiami, setSoloRichiami] = useState(false)
  const [filtroComm, setFiltroComm] = useState('')
  const [trascinata, setTrascinata] = useState<string | null>(null)
  const [sopra, setSopra] = useState<Stadio | null>(null)
  const attivi = commerciali.filter((c) => c.attivo && c.ruolo === 'commerciale')

  async function carica() {
    const { data } = await supabase.from('trattative').select('*').order('aggiornato_il', { ascending: false })
    setRighe((data as Trattativa[]) ?? [])
  }
  useEffect(() => {
    carica()
  }, [])

  function modifica(id: string, campi: Partial<Trattativa>) {
    setRighe((r) => r?.map((x) => (x.id === id ? { ...x, ...campi } : x)) ?? null)
  }

  async function sposta(id: string, stato: Stadio) {
    const t = righe?.find((x) => x.id === id)
    if (!t || t.stato === stato) return
    const chiusa = !aperta(stato)
    const campi: Partial<Trattativa> = {
      stato,
      aggiornato_il: new Date().toISOString(),
      chiuso_il: chiusa ? new Date().toISOString() : null,
      ...(chiusa ? { richiamo_il: null, prossima_azione: null } : {}),
    }
    modifica(id, campi)
    await supabase.from('trattative').update(campi).eq('id', id)
    await supabase.from('trattative_attivita').insert({
      trattativa_id: id,
      tipo: 'stadio',
      testo: `Da ${STADI.find((s) => s.v === t.stato)?.l} a ${STADI.find((s) => s.v === stato)?.l}`,
      autore: commercialeAttivo ? nomeCompleto(commercialeAttivo) : 'Titolare',
    })
    if (stato === 'perso') setAperto(id)
  }

  // Il commerciale vede le proprie e quelle non assegnate
  const visibili = useMemo(
    () =>
      (righe ?? []).filter((r) => {
        if (commercialeAttivo && r.commerciale_id && r.commerciale_id !== commercialeAttivo.id) return false
        if (!commercialeAttivo && filtroComm === 'nessuno' && r.commerciale_id) return false
        if (!commercialeAttivo && filtroComm && filtroComm !== 'nessuno' && r.commerciale_id !== filtroComm) return false
        return true
      }),
    [righe, commercialeAttivo, filtroComm]
  )

  const oggi = oggiISO()
  const inRitardo = visibili.filter((t) => aperta(t.stato) && t.richiamo_il && t.richiamo_il < oggi).length
  const oggiN = visibili.filter((t) => aperta(t.stato) && t.richiamo_il === oggi).length
  const aperte = visibili.filter((t) => aperta(t.stato))
  const valoreAperto = aperte.reduce((s, t) => s + (t.valore ?? 0), 0)
  const venduti = visibili.filter((t) => t.stato === 'venduto').length
  const persi = visibili.filter((t) => t.stato === 'perso').length
  const tasso = venduti + persi ? Math.round((venduti / (venduti + persi)) * 100) : 0

  const mostrate = visibili.filter((t) => !soloRichiami || (aperta(t.stato) && t.richiamo_il && t.richiamo_il <= oggi))
  const corrente = righe?.find((t) => t.id === aperto) ?? null

  function chiudiScheda() {
    setAperto(null)
    if (params.get('apri')) setParams({}, { replace: true })
  }

  return (
    <Layout largo>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Trattative</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ogni cliente interessato, dalla prima chiamata alla vendita. Trascina le schede da una fase all'altra.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setNuova(true)}>
          <Plus className="h-4 w-4" /> Nuova trattativa
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          etichetta="Da richiamare"
          valore={String(inRitardo + oggiN)}
          nota={inRitardo ? `${inRitardo} in ritardo, ${oggiN} per oggi` : oggiN ? `${oggiN} per oggi` : 'Nessun richiamo in sospeso'}
          tono={inRitardo ? 'attenzione' : 'ok'}
        />
        <StatTile etichetta="Trattative aperte" valore={String(aperte.length)} nota="Dal nuovo contatto alla trattativa" />
        <StatTile etichetta="Valore in corso" valore={euro(valoreAperto) || '0 €'} nota="Somma dei valori stimati" />
        <StatTile etichetta="Tasso di chiusura" valore={`${tasso}%`} nota={`${venduti} vendute, ${persi} perse`} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setSoloRichiami((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
            soloRichiami ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" /> Solo da richiamare
        </button>
        {isTitolare && !commercialeAttivo && (
          <select className="field !w-auto !py-2 !text-xs" value={filtroComm} onChange={(e) => setFiltroComm(e.target.value)}>
            <option value="">Tutti i commerciali</option>
            <option value="nessuno">Non assegnate</option>
            {attivi.map((c) => <option key={c.id} value={c.id}>{nomeCompleto(c)}</option>)}
          </select>
        )}
      </div>

      {!righe ? (
        <p className="text-sm text-neutral-500">Caricamento...</p>
      ) : (
        <div className="-mx-6 overflow-x-auto px-6 pb-4">
          <div className="grid min-w-[1180px] grid-cols-7 gap-3">
            {STADI.map((s) => {
              const col = mostrate.filter((t) => t.stato === s.v)
              const tot = col.reduce((x, t) => x + (t.valore ?? 0), 0)
              return (
                <section
                  key={s.v}
                  onDragOver={(e) => { e.preventDefault(); setSopra(s.v) }}
                  onDragLeave={() => setSopra((v) => (v === s.v ? null : v))}
                  onDrop={() => { if (trascinata) sposta(trascinata, s.v); setTrascinata(null); setSopra(null) }}
                  className={`flex min-h-[320px] flex-col rounded-xl border p-2.5 transition-colors ${
                    sopra === s.v ? 'border-brand bg-brand/5' : 'border-neutral-200 bg-neutral-50/50'
                  }`}
                >
                  <header className="mb-2.5 flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${s.punto}`} />
                      <h2 className="text-[11px] font-bold uppercase tracking-wide text-neutral-700">{s.l}</h2>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">{col.length}</span>
                  </header>
                  {tot > 0 && <p className="mb-2 px-1 text-[11px] text-neutral-500">{euro(tot)}</p>}
                  <div className="flex flex-1 flex-col gap-2">
                    {col.map((t) => {
                      const r = aperta(t.stato) ? infoRichiamo(t.richiamo_il) : null
                      const comm = commerciali.find((c) => c.id === t.commerciale_id)
                      return (
                        <article
                          key={t.id}
                          draggable
                          onDragStart={() => setTrascinata(t.id)}
                          onDragEnd={() => { setTrascinata(null); setSopra(null) }}
                          onClick={() => setAperto(t.id)}
                          className={`cursor-pointer rounded-lg border bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
                            r?.tono === 'rosso' ? 'border-red-300' : 'border-neutral-200'
                          } ${trascinata === t.id ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[13px] font-bold leading-tight text-neutral-900">{t.nome}</h3>
                            {comm ? (
                              <span title={nomeCompleto(comm)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[9px] font-bold text-neutral-600">
                                {comm.nome[0]}{comm.cognome?.[0] ?? ''}
                              </span>
                            ) : (
                              <span title="Non assegnata" className="h-5 w-5 shrink-0 rounded-full border border-dashed border-neutral-300" />
                            )}
                          </div>
                          {t.auto_interesse && <p className="mt-1 truncate text-xs text-neutral-600">{t.auto_interesse}</p>}
                          {t.valore ? <p className="mt-1 text-xs font-semibold text-neutral-900">{euro(t.valore)}</p> : null}
                          {t.prossima_azione && aperta(t.stato) && (
                            <p className="mt-2 line-clamp-2 border-t border-neutral-100 pt-2 text-[11px] leading-snug text-neutral-500">{t.prossima_azione}</p>
                          )}
                          {r && (
                            <p className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${r.tono === 'rosso' ? 'text-red-600' : r.tono === 'arancio' ? 'text-brand' : 'text-neutral-500'}`}>
                              <Phone className="h-3 w-3" /> {r.testo}
                            </p>
                          )}
                          {t.stato === 'perso' && t.motivo_perso && (
                            <p className="mt-2 line-clamp-2 text-[11px] text-neutral-500">{t.motivo_perso}</p>
                          )}
                        </article>
                      )
                    })}
                    {col.length === 0 && (
                      <p className="mt-6 text-center text-[11px] text-neutral-400">
                        {trascinata ? 'Rilascia qui' : 'Vuota'}
                      </p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}

      {corrente && <TrattativaDrawer trattativa={corrente} onClose={chiudiScheda} onChange={modifica} />}
      {nuova && (
        <NuovaTrattativa
          onClose={() => setNuova(false)}
          onCreata={(t) => {
            setRighe((r) => [t, ...(r ?? [])])
            setNuova(false)
            setAperto(t.id)
          }}
        />
      )}
    </Layout>
  )
}

function NuovaTrattativa({ onClose, onCreata }: { onClose: () => void; onCreata: (t: Trattativa) => void }) {
  const { commercialeAttivo } = useUtente()
  const [f, setF] = useState({ nome: '', telefono: '', email: '', auto_interesse: '', fonte: 'Telefono', valore: '', prossima_azione: 'Richiamare il cliente', richiamo_il: oggiISO() })
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }))

  async function crea() {
    if (!f.nome.trim()) return setErrore('Il nome del cliente è obbligatorio.')
    setSaving(true)
    const { data, error } = await supabase
      .from('trattative')
      .insert({
        nome: f.nome.trim(),
        telefono: f.telefono || null,
        email: f.email || null,
        auto_interesse: f.auto_interesse || null,
        fonte: f.fonte,
        valore: f.valore ? Number(f.valore) : null,
        prossima_azione: f.prossima_azione || null,
        richiamo_il: f.richiamo_il || null,
        commerciale_id: commercialeAttivo?.id ?? null,
      })
      .select()
      .single()
    setSaving(false)
    if (error || !data) return setErrore('Non sono riuscito a salvare. Riprova.')
    onCreata(data as Trattativa)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-neutral-900">Nuova trattativa</h2>
            <p className="text-sm text-neutral-500">Un cliente passato in salone o chiamato al telefono.</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">Cliente *</label>
            <input className="field" value={f.nome} onChange={(e) => set('nome', e.target.value)} autoFocus />
          </div>
          <div>
            <label className="field-label">Telefono</label>
            <input className="field" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="field" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Auto di interesse</label>
            <input className="field" placeholder="Es. Volkswagen Golf" value={f.auto_interesse} onChange={(e) => set('auto_interesse', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Provenienza</label>
            <select className="field" value={f.fonte} onChange={(e) => set('fonte', e.target.value)}>
              {FONTI.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Valore stimato (€)</label>
            <input type="number" className="field" value={f.valore} onChange={(e) => set('valore', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Prossima azione</label>
            <input className="field" value={f.prossima_azione} onChange={(e) => set('prossima_azione', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Da fare entro</label>
            <input type="date" className="field" min={oggiISO()} value={f.richiamo_il} onChange={(e) => set('richiamo_il', e.target.value)} />
          </div>
        </div>
        {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn-primary" onClick={crea} disabled={saving}>{saving ? 'Salvo...' : 'Crea trattativa'}</button>
        </div>
      </div>
    </div>
  )
}
