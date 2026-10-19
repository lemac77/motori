import { cliente } from '@cliente/cliente.config'

/** Avviso demo in cima al pannello, visibile solo con cliente.demo = true */
export function DemoBar() {
  if (!cliente.demo) return null
  const sito = cliente.demoInfo?.urlSito
  return (
    <div className="bg-neutral-950 px-4 py-2 text-center text-[11px] text-neutral-300 sm:text-xs">
      <strong className="uppercase tracking-wider text-brand">Gestionale demo</strong>
      <span className="mx-2 text-neutral-600">·</span>
      Prova tutto liberamente: crea annunci, carica foto, genera contratti. I dati tornano allo stato iniziale ogni notte.
      {sito && (
        <a href={sito} target="_blank" rel="noopener" className="ml-3 font-bold uppercase tracking-wider text-white hover:text-brand">
          Vedi il sito →
        </a>
      )}
    </div>
  )
}
