import { cliente } from '@cliente/cliente.config';

/** Barra fissa in basso, visibile solo con cliente.demo = true */
export default function DemoBar() {
  if (!cliente.demo) return null;
  const link = cliente.demoInfo?.urlGestionale;
  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] bg-neutral-950/95 backdrop-blur border-t border-brand/40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-center text-[11px] sm:text-xs text-neutral-300">
        <span>
          <strong className="text-brand uppercase tracking-wider">Sito dimostrativo</strong>
          <span className="mx-2 text-neutral-600">·</span>
          {cliente.azienda.nome} è un salone di fantasia: auto, prezzi e dati sono di esempio.
        </span>
        {link && (
          <a href={link} target="_blank" rel="noopener" className="font-bold uppercase tracking-wider text-white hover:text-brand transition-colors">
            Prova il gestionale →
          </a>
        )}
      </div>
    </div>
  );
}
