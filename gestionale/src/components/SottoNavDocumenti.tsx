import { Link, useLocation } from 'react-router-dom'
import { FilePlus2, Archive } from 'lucide-react'

/** Sotto-navigazione a pillole per passare tra "genera documenti" e "archivio",
 * entrambe raggiungibili dalla sezione Documenti del menu principale. */
export function SottoNavDocumenti() {
  const location = useLocation()
  const inArchivio = location.pathname.startsWith('/archivio')

  return (
    <div className="mb-6 flex gap-2">
      <Link
        to="/documenti"
        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
          !inArchivio
            ? 'bg-neutral-900 text-white'
            : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
        }`}
      >
        <FilePlus2 className="h-3.5 w-3.5" />
        Genera Documenti
      </Link>
      <Link
        to="/archivio"
        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
          inArchivio
            ? 'bg-neutral-900 text-white'
            : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
        }`}
      >
        <Archive className="h-3.5 w-3.5" />
        Archivio
      </Link>
    </div>
  )
}
