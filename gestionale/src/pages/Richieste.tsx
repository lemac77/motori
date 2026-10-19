import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Car, RefreshCw, Phone, Mail, Inbox } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Pillole, StatTile } from '../components/Grafici'
import { supabase } from '../lib/supabaseClient'
import { useUtente, nomeCompleto } from '../lib/utente'

type Stato = 'nuova' | 'contattato' | 'test_drive' | 'trattativa' | 'venduto' | 'perso'

interface Richiesta {
  id: string
  tipo: 'contatto' | 'permuta' | 'test_drive'
  nome: string
  email: string | null
  telefono: string | null
  dati: Record<string, unknown>
  stato: Stato
  commerciale_id: string | null
  note: string | null
  creato_il: string
  aggiornato_il: string | null
}

export const STATI_RICHIESTA: { v: Stato; l: string; stile: string }[] = [
  { v: 'nuova', l: 'Nuova', stile: 'bg-brand text-white' },
  { v: 'contattato', l: 'Contattato', stile: 'bg-neutral-100 text-neutral-700' },
  { v: 'test_drive', l: 'Test drive', stile: 'bg-neutral-100 text-neutral-700' },
  { v: 'trattativa', l: 'Trattativa', stile: 'bg-neutral-100 text-neutral-700' },
  { v: 'venduto', l: 'Venduto', stile: 'bg-emerald-500/15 text-emerald-600' },
  { v: 'perso', l: 'Perso', stile: 'bg-red-50 text-red-600' },
]

const TIPI = {
  contatto: { l: 'Contatto', icona: MessageSquare },
  test_drive: { l: 'Test drive', icona: Car },
  permuta: { l: 'Valutazione permuta', icona: RefreshCw },
}

// Etichette leggibili per i campi del form del sito (dati jsonb)
const LABEL: Record<string, string> = {
  auto_interesse: 'Auto di interesse',
  auto: 'Auto',
  messaggio: 'Messaggio',
  provincia: 'Provincia',
  marcaModello: 'Auto da permutare',
  dataImmatricolazione: 'Immatricolazione',
  km: 'Km',
  cilindrata: 'Cilindrata',
  alimentazione: 'Alimentazione',
  targa: 'Targa',
  colore: 'Colore',
  valoreRichiesto: 'Valore richiesto',
  note: 'Note cliente',
  dataDesiderata: 'Data desiderata',
  fasciaOraria: 'Fascia oraria',
}

function fa(data: string) {
  const min = Math.round((Date.now() - new Date(data).getTime()) / 60000)
  if (min < 60) return `${Math.max(min, 1)} min fa`
  const ore = Math.round(min / 60)
  if (ore < 24) return `${ore} ${ore === 1 ? 'ora' : 'ore'} fa`
  const gg = Math.round(ore / 24)
  return gg === 1 ? 'ieri' : `${gg} giorni fa`
}

export function Richieste() {
  const { isTitolare, commercialeAttivo, commerciali } = useUtente()
  const [righe, setRighe] = useState<Richiesta[] | null>(null)
  const [filtroStato, setFiltroStato] = useState<'aperte' | 'tutte' | Stato>('aperte')
  const [filtroComm, setFiltroComm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  async function carica() {
    const { data } = await supabase.from('richieste_sito').select('*').order('creato_il', { ascending: false })
    setRighe((data as Richiesta[]) ?? [])
  }
  useEffect(() => {
    carica()
  }, [])

  async function aggiorna(id: string, campi: Partial<Richiesta>) {
    setRighe((r) => r?.map((x) => (x.id === id ? { ...x, ...campi } : x)) ?? null)
    await supabase.from('richieste_sito').update({ ...campi, aggiornato_il: new Date().toISOString() }).eq('id', id)
  }

  // Il commerciale vede le richieste non assegnate e le sue
  const visibili = useMemo(
    () =>
      (righe ?? []).filter((r) => {
        if (commercialeAttivo && r.commerciale_id && r.commerciale_id !== commercialeAttivo.id) return false
        if (!commercialeAttivo && filtroComm === 'nessuno' && r.commerciale_id) return false
        if (!commercialeAttivo && filtroComm && filtroComm !== 'nessuno' && r.commerciale_id !== filtroComm) return false
        if (filtroTipo && r.tipo !== filtroTipo) return false
        return true
      }),
    [righe, commercialeAttivo, filtroComm, filtroTipo]
  )

  const filtrate = visibili.filter((r) =>
    filtroStato === 'tutte' ? true : filtroStato === 'aperte' ? !['venduto', 'perso'].includes(r.stato) : r.stato === filtroStato
  )

  const conta = (s: Stato) => visibili.filter((r) => r.stato === s).length
  const chiuse = conta('venduto') + conta('perso')
  const conversione = chiuse ? Math.round((conta('venduto') / chiuse) * 100) : 0
  const attivi = commerciali.filter((c) => c.attivo && c.ruolo === 'commerciale')

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900">Richieste dal sito</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Contatti, test drive e valutazioni permuta arrivati dai form del sito. Assegnale e seguile fino alla vendita.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile etichetta="Da gestire" valore={String(conta('nuova'))} nota={conta('nuova') ? 'Nuove, nessuno le ha ancora prese' : 'Tutto in ordine'} tono={conta('nuova') ? 'attenzione' : 'ok'} />
        <StatTile etichetta="In corso" valore={String(conta('contattato') + conta('test_drive') + conta('trattativa'))} nota="Contattato, test drive, trattativa" />
        <StatTile etichetta="Diventate vendite" valore={String(conta('venduto'))} />
        <StatTile etichetta="Tasso di chiusura" valore={`${conversione}%`} nota={`su ${chiuse} richieste chiuse`} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Pillole
          valori={[
            { v: 'aperte', l: 'Aperte' },
            ...STATI_RICHIESTA.map((s) => ({ v: s.v, l: `${s.l} ${conta(s.v)}` })),
            { v: 'tutte', l: 'Tutte' },
          ]}
          valore={filtroStato}
          onChange={setFiltroStato}
        />
        <select className="field !w-auto !py-2 !text-xs" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Tutti i tipi</option>
          {Object.entries(TIPI).map(([k, t]) => (
            <option key={k} value={k}>{t.l}</option>
          ))}
        </select>
        {isTitolare && !commercialeAttivo && (
          <select className="field !w-auto !py-2 !text-xs" value={filtroComm} onChange={(e) => setFiltroComm(e.target.value)}>
            <option value="">Tutti i commerciali</option>
            <option value="nessuno">Non assegnate</option>
            {attivi.map((c) => (
              <option key={c.id} value={c.id}>{nomeCompleto(c)}</option>
            ))}
          </select>
        )}
      </div>

      {!righe ? (
        <p className="text-sm text-neutral-500">Caricamento...</p>
      ) : filtrate.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 py-16 text-center">
          <Inbox className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
          <p className="text-sm text-neutral-500">Nessuna richiesta in questa vista.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrate.map((r) => {
            const T = TIPI[r.tipo] ?? TIPI.contatto
            const stato = STATI_RICHIESTA.find((s) => s.v === r.stato) ?? STATI_RICHIESTA[0]
            const dati = Object.entries(r.dati || {}).filter(([, v]) => v !== '' && v != null)
            return (
              <article key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-brand">
                      <T.icona className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-sm font-bold text-neutral-900">{r.nome}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${stato.stile}`}>{stato.l}</span>
                        <span className="text-xs text-neutral-500">{T.l} · {fa(r.creato_il)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        {r.telefono && (
                          <a href={`tel:${r.telefono.replace(/\s/g, '')}`} className="flex items-center gap-1 text-neutral-700 hover:text-brand">
                            <Phone className="h-3 w-3" /> {r.telefono}
                          </a>
                        )}
                        {r.email && (
                          <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-neutral-700 hover:text-brand">
                            <Mail className="h-3 w-3" /> {r.email}
                          </a>
                        )}
                      </div>
                      {dati.length > 0 && (
                        <dl className="mt-2 grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
                          {dati.map(([k, v]) => (
                            <div key={k} className={k === 'messaggio' ? 'sm:col-span-2' : ''}>
                              <dt className="inline text-neutral-500">{LABEL[k] ?? k}: </dt>
                              <dd className="inline text-neutral-900">{String(v)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:w-60">
                    <select
                      className="field !py-2 !text-xs"
                      value={r.stato}
                      onChange={(e) => aggiorna(r.id, { stato: e.target.value as Stato })}
                    >
                      {STATI_RICHIESTA.map((s) => (
                        <option key={s.v} value={s.v}>{s.l}</option>
                      ))}
                    </select>
                    {isTitolare ? (
                      <select
                        className="field !py-2 !text-xs"
                        value={r.commerciale_id ?? ''}
                        onChange={(e) => aggiorna(r.id, { commerciale_id: e.target.value || null })}
                      >
                        <option value="">Non assegnata</option>
                        {attivi.map((c) => (
                          <option key={c.id} value={c.id}>{nomeCompleto(c)}</option>
                        ))}
                      </select>
                    ) : !r.commerciale_id && commercialeAttivo ? (
                      <button
                        className="btn-secondary !py-2 !text-xs"
                        onClick={() => aggiorna(r.id, { commerciale_id: commercialeAttivo.id, stato: r.stato === 'nuova' ? 'contattato' : r.stato })}
                      >
                        Prendi in carico
                      </button>
                    ) : (
                      <p className="text-xs text-neutral-500">Assegnata a te</p>
                    )}
                  </div>
                </div>

                <textarea
                  className="field mt-3 !text-xs"
                  rows={1}
                  placeholder="Note interne (es. richiamato, appuntamento fissato...)"
                  defaultValue={r.note ?? ''}
                  onBlur={(e) => e.target.value !== (r.note ?? '') && aggiorna(r.id, { note: e.target.value || null })}
                />
              </article>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
