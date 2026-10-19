import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import { Login } from './pages/Login'
import { ListaAnnunci } from './pages/ListaAnnunci'
import { FormAnnuncio } from './pages/FormAnnuncio'
import { DocumentiVendita } from './pages/DocumentiVendita'
import { DocumentiHome } from './pages/DocumentiHome'
import { ArchivioGenerale } from './pages/ArchivioGenerale'
import { Impostazioni } from './pages/Impostazioni'
import { Vendite } from './pages/Vendite'
import { Richieste } from './pages/Richieste'
import { Scadenze } from './pages/Scadenze'
import { UtenteProvider } from './lib/utente'

function RequireAuth({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-bg">
        <p className="text-sm text-neutral-500">Caricamento...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {/* Ruolo e team caricati una volta per utente (cambia utente = ricarica) */}
      <UtenteProvider key={session?.user.id ?? 'ospite'}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth session={session}>
              <ListaAnnunci />
            </RequireAuth>
          }
        />
        <Route
          path="/nuovo"
          element={
            <RequireAuth session={session}>
              <FormAnnuncio />
            </RequireAuth>
          }
        />
        <Route
          path="/modifica/:id"
          element={
            <RequireAuth session={session}>
              <FormAnnuncio />
            </RequireAuth>
          }
        />
        <Route
          path="/documenti"
          element={
            <RequireAuth session={session}>
              <DocumentiHome />
            </RequireAuth>
          }
        />
        <Route
          path="/documenti/:id"
          element={
            <RequireAuth session={session}>
              <DocumentiVendita />
            </RequireAuth>
          }
        />
        <Route
          path="/archivio"
          element={
            <RequireAuth session={session}>
              <ArchivioGenerale />
            </RequireAuth>
          }
        />
        <Route
          path="/vendite"
          element={
            <RequireAuth session={session}>
              <Vendite />
            </RequireAuth>
          }
        />
        <Route
          path="/richieste"
          element={
            <RequireAuth session={session}>
              <Richieste />
            </RequireAuth>
          }
        />
        <Route
          path="/scadenze"
          element={
            <RequireAuth session={session}>
              <Scadenze />
            </RequireAuth>
          }
        />
        <Route
          path="/impostazioni"
          element={
            <RequireAuth session={session}>
              <Impostazioni />
            </RequireAuth>
          }
        />
      </Routes>
      </UtenteProvider>
    </BrowserRouter>
  )
}
