import { ReactNode, useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogOut, Settings, Sun, Moon } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTema } from '../lib/useTema'
import { cliente } from '@cliente/cliente.config'
import { DemoBar } from './DemoBar'

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [tema, toggleTema] = useTema()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const inDocumenti = location.pathname.startsWith('/documenti') || location.pathname.startsWith('/archivio')

  return (
    <div className="min-h-screen bg-dark-bg text-neutral-900">
      <DemoBar />
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-xs sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={`/brand/${tema === 'dark' ? cliente.brand.logo.chiaro : cliente.brand.logo.scuro}`} alt={cliente.azienda.nome} className="h-8 w-auto" />
            <p className="hidden text-[11px] font-medium uppercase tracking-widest text-neutral-500 sm:block">
              Pannello annunci
            </p>
          </div>

          <nav className="hidden items-center gap-2 sm:flex">
            <Link
              to="/"
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                !inDocumenti
                  ? 'bg-brand text-white'
                  : 'border border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900'
              }`}
            >
              Annunci
            </Link>
            <Link
              to="/documenti"
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                inDocumenti
                  ? 'bg-brand text-white'
                  : 'border border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900'
              }`}
            >
              Documenti
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTema}
              title={tema === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
              className="text-neutral-500 transition-colors hover:text-neutral-900"
            >
              {tema === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/impostazioni"
              title="Impostazioni"
              className="text-neutral-500 transition-colors hover:text-neutral-900"
            >
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
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
