import { useState } from 'react'
import { Users, Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useUtente, type Commerciale } from '../lib/utente'

/**
 * Team del salone (solo titolare). L'email collega la persona al suo login:
 * chi accede con quell'email ottiene il ruolo indicato qui.
 * Un login che non corrisponde a nessuna riga è considerato titolare.
 */
export function GestioneTeam() {
  const { commerciali, ricarica, isTitolare } = useUtente()
  const [nuovo, setNuovo] = useState({ nome: '', cognome: '', email: '', ruolo: 'commerciale' as Commerciale['ruolo'] })
  const [salvando, setSalvando] = useState(false)

  if (!isTitolare) return null

  async function aggiorna(id: string, campi: Partial<Commerciale>) {
    await supabase.from('commerciali').update(campi).eq('id', id)
    ricarica()
  }

  async function aggiungi() {
    if (!nuovo.nome.trim()) return
    setSalvando(true)
    await supabase.from('commerciali').insert({
      nome: nuovo.nome.trim(),
      cognome: nuovo.cognome.trim() || null,
      email: nuovo.email.trim().toLowerCase() || null,
      ruolo: nuovo.ruolo,
    })
    setNuovo({ nome: '', cognome: '', email: '', ruolo: 'commerciale' })
    setSalvando(false)
    ricarica()
  }

  return (
    <div className="mt-6 max-w-3xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="font-display mb-1 flex items-center gap-2 text-lg font-bold text-neutral-900">
        <Users className="h-5 w-5 text-brand" />
        Team commerciale
      </h2>
      <p className="mb-4 text-xs text-neutral-500">
        I commerciali vedono solo le proprie vendite e richieste, senza prezzi di acquisto e margini. L&apos;email deve essere quella con cui
        accedono al gestionale.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-3 font-semibold">Nome</th>
              <th className="py-2 pr-3 font-semibold">Email login</th>
              <th className="py-2 pr-3 font-semibold">Ruolo</th>
              <th className="py-2 font-semibold">Attivo</th>
            </tr>
          </thead>
          <tbody>
            {commerciali.map((c) => (
              <tr key={c.id} className="border-b border-neutral-200 last:border-0">
                <td className="py-2 pr-3 font-medium text-neutral-900">{[c.nome, c.cognome].filter(Boolean).join(' ')}</td>
                <td className="py-2 pr-3 text-neutral-600">{c.email || '-'}</td>
                <td className="py-2 pr-3">
                  <select className="field !w-auto !py-1.5 !text-xs" value={c.ruolo} onChange={(e) => aggiorna(c.id, { ruolo: e.target.value as Commerciale['ruolo'] })}>
                    <option value="commerciale">Commerciale</option>
                    <option value="titolare">Titolare</option>
                  </select>
                </td>
                <td className="py-2">
                  <input type="checkbox" className="h-4 w-4 accent-brand" checked={c.attivo} onChange={(e) => aggiorna(c.id, { attivo: e.target.checked })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-dashed border-neutral-200 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
        <input className="field !py-2 !text-xs" placeholder="Nome" value={nuovo.nome} onChange={(e) => setNuovo({ ...nuovo, nome: e.target.value })} />
        <input className="field !py-2 !text-xs" placeholder="Cognome" value={nuovo.cognome} onChange={(e) => setNuovo({ ...nuovo, cognome: e.target.value })} />
        <input className="field !py-2 !text-xs" placeholder="Email di login" value={nuovo.email} onChange={(e) => setNuovo({ ...nuovo, email: e.target.value })} />
        <select className="field !py-2 !text-xs" value={nuovo.ruolo} onChange={(e) => setNuovo({ ...nuovo, ruolo: e.target.value as Commerciale['ruolo'] })}>
          <option value="commerciale">Commerciale</option>
          <option value="titolare">Titolare</option>
        </select>
        <button onClick={aggiungi} disabled={salvando || !nuovo.nome.trim()} className="btn-primary !py-2 !text-xs">
          <Plus className="h-3.5 w-3.5" /> Aggiungi
        </button>
      </div>
    </div>
  )
}
