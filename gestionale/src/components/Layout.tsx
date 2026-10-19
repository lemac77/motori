import { ReactNode, useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogOut, Settings, Sun, Moon, Eye } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTema } from '../lib/useTema'
import { useUtente, nomeCompleto } from '../lib/utente'
import { cliente } from '@cliente/cliente.config'
import { DemoBar } from './DemoBar'

const VOCI = [
  { to: '/', label: 'Annunci', match: (p: string) => p === '/' || p.startsWith('/nuovo') || p.startsWith('/modifica') },
  { to: '/vendite', label: 'Vendite', match: (p: string) => p.startsWith('/vendite') },
  { to: '/richieste', label: 'Richieste', match: (p: string) => p.startsWith('/richieste') },
  { to: '/trattative', label: 'Trattative', match: (p: string) => p.startsWith('/trattative') },
  { to: '/scadenze', label: 'Scadenze', match: (p: string) => p.startsWith('/scadenze') },
  { to: '/documenti', label: 'Documenti', match: (p: string) => p.startsWith('/documenti') || p.startsWith('/archivio') },
]

export function Layout({ children, largo = false }: { children: ReactNode; largo?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [tema, toggleTema] = useTema()
  const { ruoloReale, commerciali, vistaCome, setVistaCome, commercialeAttivo } = useUtente()
  const [richiesteNuove, setRichiesteNuove] = useState(0)
  const [richiami, setRichiami] = useState(0)

  useEffect(() => {
    let q = supabase.from('richieste_sito').select('id', { count: 'exact', head: true }).eq('stato', 'nuova')
    if (commercialeAttivo) q = q.or(`commerciale_id.is.null,commerciale_id.eq.${commercialeAttivo.id}`)
    q.then(({ count }) => setRichiesteNuove(count ?? 0))

    // Richiami scaduti o di oggi nelle trattative aperte
    const d = new Date()
    const oggi = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    let t = supabase
      .from('trattative')
      .select('id', { count: 'exact', head: true })
      .lte('richiamo_il', oggi)
      .not('stato', 'in', '(venduto,perso)')
    if (commercialeAttivo) t = t.or(`commerciale_id.is.null,commerciale_id.eq.${commercialeAttivo.id}`)
    t.then(({ count }) => setRichiami(count ?? 0))
  }, [location.pathname, commercialeAttivo])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const largh = largo ? 'max-w-6xl' : 'max-w-5xl'
  const voce = (v: (typeof VOCI)[number], mobile = false) => {
    const attiva = v.match(location.pathname)
    return (
      <Link
        key={v.to}
        to={v.to}
        className={`relative shrink-0 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
          attiva ? 'bg-brand text-white' : `${mobile ? '' : 'border border-neutral-200'} text-neutral-500 hover:border-neutral-300 hover:text-neutral-900`
        }`}
      >
        {v.label}
        {v.to === '/trattative' && richiami > 0 && (
          <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${attiva ? 'bg-white/25' : 'bg-brand text-white'}`}>{richiami}</span>
        )}
        {v.to === '/richieste' && richiesteNuove > 0 && (
          <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${attiva ? 'bg-white/25' : 'bg-brand text-white'}`}>{richiesteNuove}</span>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg text-neutral-900">
      <DemoBar />
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-xs">
        <div className={`mx-auto flex ${largh} items-center justify-between gap-4 px-6 py-4`}>
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img src={`/brand/${tema === 'dark' ? cliente.brand.logo.chiaro : cliente.brand.logo.scuro}`} alt={cliente.azienda.nome} className="h-8 w-auto" />
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex">{VOCI.map((v) => voce(v))}</nav>

          <div className="flex items-center gap-4">
            {ruoloReale === 'titolare' && commerciali.some((c) => c.ruolo === 'commerciale') && (
              <label
                className={`hidden items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold lg:flex ${
                  vistaCome ? 'border-brand text-brand' : 'border-neutral-200 text-neutral-500'
                }`}
                title="Anteprima: vedi il gestionale con i permessi di un commerciale"
              >
                <Eye className="h-3.5 w-3.5" />
                <select
                  className="bg-transparent outline-none"
                  value={vistaCome ?? ''}
                  onChange={(e) => setVistaCome(e.target.value || null)}
                >
                  <option value="">Vista titolare</option>
                  {commerciali.filter((c) => c.ruolo === 'commerciale').map((c) => (
                    <option key={c.id} value={c.id}>Come {nomeCompleto(c)}</option>
                  ))}
                </select>
              </label>
            )}
            <button
              onClick={toggleTema}
              title={tema === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
              className="text-neutral-500 transition-colors hover:text-neutral-900"
            >
              {tema === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/impostazioni" title="Impostazioni" className="text-neutral-500 transition-colors hover:text-neutral-900">
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Esci
            </button>
          </div>
        </div>
        {/* Menu mobile: scorrevole orizzontale */}
        <nav className="flex gap-1 overflow-x-auto border-t border-neutral-200 px-4 py-2 md:hidden">{VOCI.map((v) => voce(v, true))}</nav>
      </header>

      {vistaCome && (
        <div className="border-b border-brand/30 bg-brand/10 px-6 py-2 text-center text-xs text-neutral-700">
          Stai vedendo il gestionale come <strong>{nomeCompleto(commercialeAttivo)}</strong>: solo le sue vendite e richieste, niente margini.{' '}
          <button onClick={() => setVistaCome(null)} className="font-semibold text-brand underline">Torna titolare</button>
        </div>
      )}

      <main className={`mx-auto ${largh} px-6 py-10`}>{children}</main>
    </div>
  )
}
