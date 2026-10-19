/**
 * Comprime un'immagine lato client prima dell'upload.
 * Genera due versioni:
 * - thumbnail: max 400px lato lungo, per liste/gallery (risparmia banda)
 * - originale: max 1600px lato lungo, per dettaglio/zoom
 *
 * Questo taglia drasticamente storage e banda su Supabase.
 */

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}

function resizeToBlob(img: HTMLImageElement, maxSide: number, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  let { width, height } = img

  if (width > height && width > maxSide) {
    height = Math.round((height * maxSide) / width)
    width = maxSide
  } else if (height > maxSide) {
    width = Math.round((width * maxSide) / height)
    height = maxSide
  }

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context non disponibile')
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Compressione fallita'))),
      'image/jpeg',
      quality
    )
  })
}

export interface ProcessedImage {
  originale: Blob
  thumbnail: Blob
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file)
  const [originale, thumbnail] = await Promise.all([
    resizeToBlob(img, 1600, 0.8),
    resizeToBlob(img, 400, 0.75),
  ])
  return { originale, thumbnail }
}
