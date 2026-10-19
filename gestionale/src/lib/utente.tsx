import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export interface Commerciale {
  id: string
  nome: string
  cognome: string | null
  email: string | null
  ruolo: 'titolare' | 'commerciale'
  attivo: boolean
}

export const nomeCompleto = (c?: Pick<Commerciale, 'nome' | 'cognome'> | null) =>
  c ? [c.nome, c.cognome].filter(Boolean).join(' ') : ''

interface StatoUtente {
  pronto: boolean
  commerciali: Commerciale[]
  /** Record commerciale dell'utente loggato (match per email), se esiste */
  io: Commerciale | null
  /** Ruolo reale: se l'email non corrisponde a nessun commerciale, è il titolare */
  ruoloReale: 'titolare' | 'commerciale'
  /** Il titolare può "vedere come" un commerciale (anteprima permessi) */
  vistaCome: string | null
  setVistaCome: (id: string | null) => void
  /** Ruolo effettivo dopo l'eventuale anteprima */
  isTitolare: boolean
  /** Commerciale effettivo (null = titolare, vede tutto) */
  commercialeAttivo: Commerciale | null
  ricarica: () => Promise<void>
}

const Ctx = createContext<StatoUtente | null>(null)
const CHIAVE_VISTA = 'gestionale-vista-come'

/**
 * Permessi:
 *  - titolare: vede tutto, margini compresi, gestisce i commerciali
 *  - commerciale: vede solo le proprie vendite e richieste, niente margini/prezzi di acquisto
 * Nota: i permessi sono applicati nell'interfaccia. Per un cliente con più
 * commerciali reali andranno blindati anche con policy RLS sul database.
 */
export function UtenteProvider({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false)
  const [commerciali, setCommerciali] = useState<Commerciale[]>([])
  const [email, setEmail] = useState<string | null>(null)
  const [vistaCome, setVista] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CHIAVE_VISTA)
    } catch {
      return null
    }
  })

  const ricarica = useCallback(async () => {
    const [{ data: u }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('commerciali').select('*').order('ruolo', { ascending: false }).order('nome'),
    ])
    setEmail(u.user?.email?.toLowerCase() ?? null)
    setCommerciali((data as Commerciale[]) ?? [])
    setPronto(true)
  }, [])

  useEffect(() => {
    ricarica()
  }, [ricarica])

  const setVistaCome = (id: string | null) => {
    setVista(id)
    try {
      if (id) localStorage.setItem(CHIAVE_VISTA, id)
      else localStorage.removeItem(CHIAVE_VISTA)
    } catch {
      /* storage non disponibile */
    }
  }

  const io = commerciali.find((c) => c.email && c.email.toLowerCase() === email) ?? null
  const ruoloReale = io?.ruolo ?? 'titolare'
  const anteprima =
    ruoloReale === 'titolare' && vistaCome ? commerciali.find((c) => c.id === vistaCome && c.ruolo === 'commerciale') ?? null : null
  const commercialeAttivo = ruoloReale === 'commerciale' ? io : anteprima
  const isTitolare = !commercialeAttivo

  return (
    <Ctx.Provider
      value={{ pronto, commerciali, io, ruoloReale, vistaCome: anteprima?.id ?? null, setVistaCome, isTitolare, commercialeAttivo, ricarica }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useUtente() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useUtente fuori da UtenteProvider')
  return v
}
