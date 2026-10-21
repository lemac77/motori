import { useEffect, useRef, useState } from 'react'
import { X, Eraser, Check } from 'lucide-react'

/** Riquadro per firmare con dito, penna o mouse (pensato per tablet). Restituisce un PNG trasparente. */
export function FirmaPad({ titolo, onConferma, onChiudi }: {
  titolo: string
  onConferma: (png: string) => void
  onChiudi: () => void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const disegnando = useRef(false)
  const [vuoto, setVuoto] = useState(true)

  useEffect(() => {
    const c = ref.current!
    const dpr = window.devicePixelRatio || 1
    const r = c.getBoundingClientRect()
    c.width = r.width * dpr
    c.height = r.height * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111'
  }, [])

  const punto = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function inizia(e: React.PointerEvent) {
    e.preventDefault()
    ref.current!.setPointerCapture(e.pointerId)
    disegnando.current = true
    const ctx = ref.current!.getContext('2d')!
    const p = punto(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + 0.01, p.y + 0.01)
    ctx.stroke()
    setVuoto(false)
  }
  function muovi(e: React.PointerEvent) {
    if (!disegnando.current) return
    const ctx = ref.current!.getContext('2d')!
    const p = punto(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  const fine = () => {
    disegnando.current = false
  }

  function pulisci() {
    const c = ref.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setVuoto(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-neutral-900">{titolo}</h2>
            <p className="text-xs text-neutral-500">Firma nel riquadro con il dito o con la penna.</p>
          </div>
          <button onClick={onChiudi} className="text-neutral-500 hover:text-neutral-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <canvas
          ref={ref}
          onPointerDown={inizia}
          onPointerMove={muovi}
          onPointerUp={fine}
          onPointerCancel={fine}
          className="h-56 w-full touch-none rounded-xl border-2 border-dashed border-neutral-300 bg-white"
        />
        <div className="mt-4 flex items-center justify-between">
          <button className="btn-secondary" onClick={pulisci}>
            <Eraser className="h-4 w-4" /> Cancella
          </button>
          <button
            className="btn-primary"
            disabled={vuoto}
            onClick={() => onConferma(ref.current!.toDataURL('image/png'))}
          >
            <Check className="h-4 w-4" /> Conferma firma
          </button>
        </div>
      </div>
    </div>
  )
}
