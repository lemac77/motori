import { ReactNode, useState } from 'react'

/* Grafici leggeri fatti a mano (niente librerie): una serie alla volta nel
   colore del brand, barre sottili con estremità arrotondata, griglia
   recessiva, valore in punta e tooltip al passaggio del mouse. */

export function Pannello({ titolo, sottotitolo, azioni, children, className = '' }: {
  titolo: string
  sottotitolo?: string
  azioni?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-bold text-neutral-900">{titolo}</h2>
          {sottotitolo && <p className="mt-0.5 text-xs text-neutral-500">{sottotitolo}</p>}
        </div>
        {azioni}
      </div>
      {children}
    </section>
  )
}

export function StatTile({ etichetta, valore, nota, tono }: {
  etichetta: string
  valore: string
  nota?: string
  tono?: 'ok' | 'attenzione'
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-neutral-500">{etichetta}</p>
      <p className="font-display mt-1 text-2xl font-bold text-neutral-900">{valore}</p>
      {nota && (
        <p className={`mt-0.5 text-[11px] ${tono === 'attenzione' ? 'text-red-600' : tono === 'ok' ? 'text-emerald-600' : 'text-neutral-500'}`}>
          {nota}
        </p>
      )}
    </div>
  )
}

export interface RigaBarra {
  etichetta: string
  valore: number
  /** testo mostrato in punta alla barra */
  testo: string
  /** righe extra nel tooltip */
  dettagli?: string[]
}

/** Barre orizzontali ordinate: ranking (marche, commerciali, province...) */
export function BarreOrizzontali({ righe, vuoto = 'Nessun dato nel periodo' }: { righe: RigaBarra[]; vuoto?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...righe.map((r) => r.valore), 0)
  if (!righe.length || max <= 0) return <p className="py-6 text-center text-xs text-neutral-500">{vuoto}</p>
  return (
    <div className="flex flex-col gap-2.5">
      {righe.map((r, i) => (
        <div
          key={r.etichetta}
          className="relative grid grid-cols-[minmax(88px,30%)_1fr] items-center gap-3 rounded-md py-0.5"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="truncate text-xs text-neutral-700" title={r.etichetta}>{r.etichetta}</span>
          <div className="flex items-center gap-2">
            <div className="h-3.5 flex-1">
              <div
                className="h-full rounded-r-[4px] transition-opacity"
                style={{ width: `${Math.max((r.valore / max) * 100, 1.5)}%`, background: 'var(--brand)', opacity: hover === null || hover === i ? 1 : 0.45 }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums text-neutral-900">{r.testo}</span>
          </div>
          {hover === i && r.dettagli?.length ? (
            <div className="pointer-events-none absolute left-[30%] top-full z-20 mt-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] text-neutral-700 shadow-lg">
              <p className="mb-0.5 font-semibold text-neutral-900">{r.etichetta}</p>
              {r.dettagli.map((d) => (
                <p key={d}>{d}</p>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export interface Colonna {
  etichetta: string
  valore: number
  dettagli: string[]
}

/** Colonne verticali per l'andamento mensile, con tooltip */
export function ColonneMensili({ colonne, formato }: { colonne: Colonna[]; formato: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = 220, padL = 44, padB = 26, padT = 12
  const max = Math.max(...colonne.map((c) => c.valore), 1)
  // tacche "pulite"
  const passo = Math.pow(10, Math.floor(Math.log10(max)))
  const top = Math.ceil(max / passo) * passo
  const tacche = [0, top / 2, top]
  const slot = (W - padL) / colonne.length
  const bw = Math.min(24, slot * 0.6)
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Andamento mensile">
        {tacche.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-neutral-200" strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="fill-neutral-500" fontSize={10}>
              {formato(t)}
            </text>
          </g>
        ))}
        {colonne.map((c, i) => {
          const x = padL + slot * i + (slot - bw) / 2
          const h = Math.max(y(0) - y(c.valore), c.valore > 0 ? 2 : 0)
          const r = Math.min(4, h)
          return (
            <g key={c.etichetta} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + bw - r} Q${x + bw},${y(0) - h} ${x + bw},${y(0) - h + r} V${y(0)} Z`}
                  fill="var(--brand)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              <text x={padL + slot * i + slot / 2} y={H - 8} textAnchor="middle" className="fill-neutral-500" fontSize={10}>
                {c.etichetta}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[11px] text-neutral-700 shadow-lg"
          style={{ left: `${((padL + slot * hover + slot / 2) / W) * 100}%` }}
        >
          <p className="mb-0.5 font-semibold text-neutral-900">{colonne[hover].etichetta}</p>
          {colonne[hover].dettagli.map((d) => (
            <p key={d}>{d}</p>
          ))}
        </div>
      )}
    </div>
  )
}

/** Selettore a pillole (periodo, metrica) */
export function Pillole<T extends string>({ valori, valore, onChange }: { valori: { v: T; l: string }[]; valore: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
      {valori.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            valore === o.v ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}
