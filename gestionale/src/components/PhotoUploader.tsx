import { useState } from 'react'
import { UploadCloud, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { processImage } from '../lib/imageProcessing'

interface Props {
  annuncioId: string
  onUploaded?: () => void
}

export function PhotoUploader({ annuncioId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    setProgress({ done: 0, total: files.length })

    try {
      const { data: existing } = await supabase
        .from('annuncio_foto')
        .select('ordine')
        .eq('annuncio_id', annuncioId)
        .order('ordine', { ascending: false })
        .limit(1)

      const baseOrdine = existing && existing.length > 0 ? existing[0].ordine + 1 : 0
      const fileList = Array.from(files)

      // Prima erano una alla volta in sequenza (lento con tante foto).
      // Ora comprimiamo e carichiamo tutte in parallelo, molto più veloce
      // soprattutto con connessioni mobile normali.
      const risultati = await Promise.allSettled(
        fileList.map(async (file, i) => {
          const { originale, thumbnail } = await processImage(file)

          const baseName = `${annuncioId}/${crypto.randomUUID()}`
          const pathOriginale = `${baseName}-full.jpg`
          const pathThumbnail = `${baseName}-thumb.jpg`

          const [upOrig, upThumb] = await Promise.all([
            supabase.storage.from('annunci-foto').upload(pathOriginale, originale, {
              contentType: 'image/jpeg',
            }),
            supabase.storage.from('annunci-foto').upload(pathThumbnail, thumbnail, {
              contentType: 'image/jpeg',
            }),
          ])

          if (upOrig.error) throw upOrig.error
          if (upThumb.error) throw upThumb.error

          const urlOriginale = supabase.storage.from('annunci-foto').getPublicUrl(pathOriginale)
            .data.publicUrl
          const urlThumbnail = supabase.storage.from('annunci-foto').getPublicUrl(pathThumbnail)
            .data.publicUrl

          const { error: insertError } = await supabase.from('annuncio_foto').insert({
            annuncio_id: annuncioId,
            url_originale: urlOriginale,
            url_thumbnail: urlThumbnail,
            ordine: baseOrdine + i,
          })

          if (insertError) throw insertError

          setProgress((p) => ({ ...p, done: p.done + 1 }))
        })
      )

      const fallite = risultati.filter((r) => r.status === 'rejected')
      if (fallite.length > 0) {
        console.error(fallite)
        setError(`${fallite.length} foto non caricate su ${fileList.length}. Riprova con quelle mancanti.`)
      }

      onUploaded?.()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition-colors hover:border-brand/50">
        <UploadCloud className="h-6 w-6 text-neutral-400" />
        <span className="text-sm font-semibold text-neutral-600">
          {uploading ? `Caricamento ${progress.done}/${progress.total}...` : 'Trascina o clicca per caricare foto'}
        </span>
        <span className="text-xs text-neutral-400">JPG, PNG — puoi selezionarne più di una</span>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
