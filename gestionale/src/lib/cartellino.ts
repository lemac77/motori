import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { cliente } from '@cliente/cliente.config'
import { LOGO_PDF, LOGO_PDF_ASPECT } from 'virtual:logo-pdf'
import { COLORE_PRIMARIO, hexToRgb } from './companyInfo'

export interface DatiCartellino {
  id: string
  marca: string
  modello: string
  versione?: string | null
  prezzo: number
  km: number
  anno?: number | null
  alimentazione?: string | null
  cambio?: string | null
  cv?: number | null
  targa?: string | null
}

/** Cartellino A4 da esporre sul parabrezza: prezzo ben visibile e QR alla scheda sul sito. */
export async function generaCartellino(a: DatiCartellino) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const [r, g, b] = hexToRgb(COLORE_PRIMARIO)
  const eur = (v: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 }).format(v)

  // Fascia superiore con logo
  const lw = 52
  doc.addImage(LOGO_PDF, 'PNG', 15, 14, lw, lw * LOGO_PDF_ASPECT)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110, 110, 110)
  doc.text(`${cliente.showroom.citta} · ${cliente.contatti.telefono ?? cliente.contatti.email}`, W - 15, 20, { align: 'right' })
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(1)
  doc.line(15, 38, W - 15, 38)

  // Titolo
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  const titolo = `${a.marca} ${a.modello}`
  doc.setFontSize(titolo.length > 18 ? 40 : 52)
  doc.text(titolo, 15, 66, { maxWidth: W - 30 })
  if (a.versione) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(20)
    doc.setTextColor(90, 90, 90)
    doc.text(a.versione, 15, 80, { maxWidth: W - 30 })
  }

  // Dati chiave in griglia 2x3
  const dati: [string, string][] = [
    ['Anno', a.anno ? String(a.anno) : '-'],
    ['Chilometri', `${eur(a.km)} km`],
    ['Alimentazione', a.alimentazione ?? '-'],
    ['Cambio', a.cambio ?? '-'],
    ['Potenza', a.cv ? `${a.cv} CV` : '-'],
    ['Garanzia', `${cliente.offerta.garanziaMesi} mesi`],
  ]
  const cw = (W - 30) / 3
  dati.forEach(([k, v], i) => {
    const x = 15 + (i % 3) * cw
    const y = 100 + Math.floor(i / 3) * 26
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(k.toUpperCase(), x, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(20, 20, 20)
    doc.text(v, x, y + 10)
  })

  // Prezzo
  doc.setFillColor(r, g, b)
  doc.roundedRect(15, 160, W - 30, 50, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(64)
  doc.text(`€ ${eur(a.prezzo)}`, W / 2, 196, { align: 'center' })

  // QR + testo
  const url = `${cliente.sito.url}/parco-auto/${a.id}`
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 600, color: { dark: '#141414', light: '#ffffff' } })
  doc.addImage(qr, 'PNG', 15, 224, 48, 48)
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(18)
  doc.text('Foto, scheda completa e rata', 72, 238)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(90, 90, 90)
  doc.text('Inquadra il codice con la fotocamera del telefono.', 72, 247)
  doc.text(url.replace('https://', ''), 72, 255, { maxWidth: 120 })

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`${cliente.azienda.ragioneSociale} · prezzo IVA inclusa salvo diversa indicazione`, W / 2, 286, { align: 'center' })

  doc.save(`cartellino-${a.marca}-${a.modello}.pdf`.replace(/\s+/g, '-').toLowerCase())
}
