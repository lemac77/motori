import { useEffect, useState } from 'react'

export type Tema = 'light' | 'dark'

const CHIAVE_STORAGE = 'gestionale-tema'

function leggiTemaSalvato(): Tema {
  if (typeof window === 'undefined') return 'light'
  const salvato = window.localStorage.getItem(CHIAVE_STORAGE)
  return salvato === 'dark' ? 'dark' : 'light'
}

function applicaTema(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'dark')
}

// Applica il tema salvato il prima possibile (anche prima che React monti,
// così non c'è un lampo di tema sbagliato all'apertura della pagina).
if (typeof window !== 'undefined') {
  applicaTema(leggiTemaSalvato())
}

/**
 * Hook condiviso per il tema chiaro/scuro del pannello. Usalo in ogni pagina
 * (anche quelle fuori da Layout, tipo Login) per restare sincronizzati.
 */
export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(leggiTemaSalvato)

  useEffect(() => {
    applicaTema(tema)
    window.localStorage.setItem(CHIAVE_STORAGE, tema)
  }, [tema])

  function toggleTema() {
    setTema((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return [tema, toggleTema]
}
