import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Check, Phone, ShieldCheck, Wrench, FileWarning, Undo2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Pannello, StatTile } from '../components/Grafici'
import { supabase } from '../lib/supabaseClient'
import { useUtente } from '../lib/utente'

type Tipo = 'revisione' | 'bollo' | 'garanzia' | 'tagliando'

interface Auto {
  id: string
  marca: string
  modello: string
  targa: string | null
  stato_pubblicazione: string
  scadenza_revisione: string | null
  scadenza_bollo: string | null
  venduto_il: string | null
  garanzia_aggiuntiva_mesi: number | null
  commerciale_id: string | null
  cliente_nome: string | null
  cliente_cognome: string | null
  cliente_cellulare: string | null
}

interface Voce {
  chiave: string
  annuncioId: string
  tipo: Tipo
  data: Date
  giorni: number
  auto: Auto
  fatto: boolean
}

// Finestre: da quanti giorni prima (negativo = già scaduta) mostrare ogni promemoria
const FINESTRE: Record<Tipo, [number, number]> = {
  revisione: [-90, 60],
  bollo: [-90, 60],
  garanzia: [-15, 60],
  tagliando: [-30, 45],
}

const SEZIONI: { tipo: Tipo; titolo: string; sotto: string; icona: typeof Wrench; azione: string }[] = [
  { tipo: 'revisione', titolo: 'Revisioni auto in stock', sotto: 'Da fare prima di consegnare o pubblicare', icona: FileWarning, azione: 'Revisione fatta' },
  { tipo: 'bollo', titolo: 'Bolli auto in stock', sotto: 'Bollo da pagare sulle auto in vetrina', icona: CalendarClock, azione: 'Pagato' },
  { tipo: 'tagliando', titolo: 'Clienti a 12 mesi dalla consegna', sotto: 'Richiamo tagliando e proposta di estensione garanzia', icona: Wrench, azione: 'Cliente contattato' },
  { tipo: 'garanzia', titolo: 'Garanzie estese in scadenza', sotto: 'Clienti con estensione: proponi il rinnovo prima che scada', icona: ShieldCheck, azione: 'Cliente contattato' },
]

const piuMesi = (d: string, mesi: number) => {
  const x = new Date(d)
  x.setMonth(x.getMonth() + mesi)
  return x
}

export function Scadenze() {
  const { commercialeAttivo } = useUtente()
  const [auto, setAuto] = useState<Auto[] | null>(null)
  const [fatti, setFatti] = useState<Set<string>>(new Set())
  const [mostraGestite, setMostraGestite] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase
        .from('annunci')
        .select('id, marca, modello, targa, stato_pubblicazione, scadenza_revisione, scadenza_bollo, venduto_il, garanzia_aggiuntiva_mesi, commerciale_id, cliente_nome, cliente_cognome, cliente_cellulare'),
      supabase.from('promemoria_fatti').select('annuncio_id, tipo'),
    ]).then(([a, p]) => {
      setAuto((a.data as Auto[]) ?? [])
      setFatti(new Set(((p.data as { annuncio_id: string; tipo: string }[]) ?? []).map((x) => `${x.annuncio_id}:${x.tipo}`)))
    })
  }, [])

  const voci = useMemo(() => {
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    const out: Voce[] = []
    const aggiungi = (a: Auto, tipo: Tipo, data: Date | null) => {
      if (!data || isNaN(data.getTime())) return
      const giorni = Math.round((data.getTime() - oggi.getTime()) / 86400000)
      const [da, a_] = FINESTRE[tipo]
      if (giorni < da || giorni > a_) return
      const chiave = `${a.id}:${tipo}`
      out.push({ chiave, annuncioId: a.id, tipo, data, giorni, auto: a, fatto: fatti.has(chiave) })
    }
    for (const a of auto ?? []) {
      if (a.stato_pubblicazione !== 'venduto') {
        aggiungi(a, 'revisione', a.scadenza_revisione ? new Date(a.scadenza_revisione) : null)
        aggiungi(a, 'bollo', a.scadenza_bollo ? new Date(a.scadenza_bollo) : null)
      } else if (a.venduto_il) {
        // il commerciale vede i promemoria dei suoi clienti
        if (commercialeAttivo && a.commerciale_id !== commercialeAttivo.id) continue
        // garanzia base 12 mesi: rientra nel richiamo a 12 mesi; qui solo le estensioni
        if ((a.garanzia_aggiuntiva_mesi ?? 0) > 0) aggiungi(a, 'garanzia', piuMesi(a.venduto_il, 12 + (a.garanzia_aggiuntiva_mesi ?? 0)))
        aggiungi(a, 'tagliando', piuMesi(a.venduto_il, 12))
      }
    }
    return out.sort((x, y) => x.giorni - y.giorni)
  }, [auto, fatti, commercialeAttivo])

  async function segna(v: Voce, fatto: boolean) {
    setFatti((s) => {
      const n = new Set(s)
      if (fatto) n.add(v.chiave)
      else n.delete(v.chiave)
      return n
    })
    if (fatto) await supabase.from('promemoria_fatti').upsert({ annuncio_id: v.annuncioId, tipo: v.tipo }, { onConflict: 'annuncio_id,tipo' })
    else await supabase.from('promemoria_fatti').delete().eq('annuncio_id', v.annuncioId).eq('tipo', v.tipo)
  }

  const aperte = voci.filter((v) => !v.fatto)
  const scadute = aperte.filter((v) => v.giorni < 0).length
  const settimana = aperte.filter((v) => v.giorni >= 0 && v.giorni <= 7).length

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Scadenze</h1>
          <p className="mt-1 text-sm text-neutral-500">Revisioni e bolli delle auto in stock, garanzie e tagliandi dei clienti.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input type="checkbox" className="h-4 w-4 accent-brand" checked={mostraGestite} onChange={(e) => setMostraGestite(e.target.checked)} />
          Mostra anche quelle gestite
        </label>
      </div>

      {!auto ? (
        <p className="text-sm text-neutral-500">Caricamento...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <StatTile etichetta="Da gestire" valore={String(aperte.length)} />
            <StatTile etichetta="Già scadute" valore={String(scadute)} tono={scadute ? 'attenzione' : 'ok'} nota={scadute ? 'Da sistemare subito' : 'Nessuna'} />
            <StatTile etichetta="Entro 7 giorni" valore={String(settimana)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {SEZIONI.map((s) => {
              const lista = voci.filter((v) => v.tipo === s.tipo && (mostraGestite || !v.fatto))
              return (
                <Pannello
                  key={s.tipo}
                  titolo={`${s.titolo} (${lista.filter((v) => !v.fatto).length})`}
                  sottotitolo={s.sotto}
                  azioni={<s.icona className="h-4 w-4 text-brand" />}
                >
                  {lista.length === 0 ? (
                    <p className="py-4 text-center text-xs text-neutral-500">Niente in scadenza</p>
                  ) : (
                    <ul className="divide-y divide-neutral-200">
                      {lista.map((v) => {
                        const cliente = [v.auto.cliente_nome, v.auto.cliente_cognome].filter(Boolean).join(' ')
                        const badge =
                          v.giorni < 0
                            ? { t: `Scaduta da ${-v.giorni} gg`, c: 'bg-red-50 text-red-600' }
                            : v.giorni === 0
                              ? { t: 'Oggi', c: 'bg-red-50 text-red-600' }
                              : { t: `tra ${v.giorni} gg`, c: v.giorni <= 15 ? 'bg-brand/15 text-brand' : 'bg-neutral-100 text-neutral-600' }
                        return (
                          <li key={v.chiave} className={`flex items-center justify-between gap-3 py-2.5 ${v.fatto ? 'opacity-50' : ''}`}>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.c}`}>{badge.t}</span>
                                <Link to={`/modifica/${v.annuncioId}`} className="truncate text-sm font-semibold text-neutral-900 hover:text-brand">
                                  {v.auto.marca} {v.auto.modello}
                                </Link>
                                {v.auto.targa && <span className="text-xs text-neutral-500">{v.auto.targa}</span>}
                              </div>
                              <p className="mt-0.5 text-xs text-neutral-500">
                                {v.data.toLocaleDateString('it-IT')}
                                {cliente && <> · {cliente}</>}
                                {v.auto.cliente_cellulare && (
                                  <a href={`tel:${v.auto.cliente_cellulare.replace(/\s/g, '')}`} className="ml-2 inline-flex items-center gap-1 text-neutral-700 hover:text-brand">
                                    <Phone className="h-3 w-3" /> {v.auto.cliente_cellulare}
                                  </a>
                                )}
                              </p>
                            </div>
                            {v.fatto ? (
                              <button onClick={() => segna(v, false)} className="btn-secondary shrink-0 !px-2.5 !py-1.5 !text-[11px]" title="Annulla">
                                <Undo2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => segna(v, true)} className="btn-secondary shrink-0 !px-2.5 !py-1.5 !text-[11px]">
                                <Check className="h-3.5 w-3.5" /> {s.azione}
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </Pannello>
              )
            })}
          </div>
        </>
      )}
    </Layout>
  )
}
