import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Sun, Moon } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTema } from '../lib/useTema'
import { cliente } from '@cliente/cliente.config'
import { DemoBar } from '../components/DemoBar'

export function Login() {
  // Le credenziali demo non sono nel codice: arrivano via email dalla landing.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [tema, toggleTema] = useTema()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o password non corrette.')
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
      <DemoBar />
      <div className="flex flex-1 items-center justify-center px-6">
      <button
        onClick={toggleTema}
        title={tema === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
        className="fixed right-6 top-12 text-neutral-500 transition-colors hover:text-neutral-900"
      >
        {tema === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={`/brand/${tema === 'dark' ? cliente.brand.logo.chiaro : cliente.brand.logo.scuro}`} alt={cliente.azienda.nome} className="mb-5 h-14 w-auto" />
          <p className="text-sm text-neutral-500">Accedi al pannello gestione annunci</p>
          {cliente.demo && (
            <p className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              Usa le credenziali demo che hai ricevuto via email.
              {cliente.demoInfo?.urlLanding && (
                <>
                  {' '}Non le hai?{' '}
                  <a href={`${cliente.demoInfo.urlLanding}#demo`} className="font-semibold underline">
                    Richiedile qui
                  </a>
                </>
              )}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <label className="field-label">Email</label>
            <input
              type="email"
              className="field"
              placeholder={cliente.gestionale.placeholderEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-5">
            <label className="field-label">Password</label>
            <input
              type="password"
              className="field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </form>
      </div>
      </div>
    </div>
  )
}
