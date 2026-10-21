import { jsPDF } from 'jspdf'
import { AZIENDA, rigaContattiPdf, hexToRgb, COLORE_PRIMARIO } from './companyInfo'
import { LOGO_PDF, LOGO_PDF_ASPECT } from 'virtual:logo-pdf'
import { ICONA_FRONTE, ICONA_FRONTE_RATIO, ICONA_RETRO, ICONA_RETRO_RATIO, ICONA_LATERALE_SX, ICONA_LATERALE_DX, ICONA_LATERALE_SX_RATIO } from './veicoloIcone'

const MARGIN = 15
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const BLUE = hexToRgb(COLORE_PRIMARIO) // colore primario del cliente (config)
const DARK = [20, 20, 20] as const
const GRAY = [110, 110, 110] as const

export interface DocContext {
  doc: jsPDF
  y: number
}

const LOGO_ASPECT = LOGO_PDF_ASPECT // letto in automatico dal PNG in /brand

/** Crea un nuovo documento con intestazione azienda + titolo del documento. */
export function creaDocumento(titolo: string, sottotitolo?: string): DocContext {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const logoWidth = 42
  const logoHeight = logoWidth * LOGO_ASPECT
  doc.addImage(LOGO_PDF, 'PNG', MARGIN, 12, logoWidth, logoHeight)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text(AZIENDA.claim, MARGIN, 12 + logoHeight + 4)

  // Contatti showroom, allineati a destra
  doc.setFontSize(8.5)
  doc.text(AZIENDA.indirizzoShowroom, PAGE_WIDTH - MARGIN, 15, { align: 'right' })
  doc.text(AZIENDA.capCittaShowroom, PAGE_WIDTH - MARGIN, 19, { align: 'right' })
  if (rigaContattiPdf()) doc.text(rigaContattiPdf(), PAGE_WIDTH - MARGIN, 23, { align: 'right' })

  // Linea separatrice
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, 29, PAGE_WIDTH - MARGIN, 29)

  // Titolo documento
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...DARK)
  doc.text(titolo, MARGIN, 38)

  let y = 38

  if (sottotitolo) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text(sottotitolo, MARGIN, 44)
    y = 44
  }

  return { doc, y: y + 8 }
}

/** Controlla se serve andare a pagina nuova prima di scrivere altro contenuto. */
export function assicuraSpazio(ctx: DocContext, altezzaNecessaria: number): DocContext {
  if (ctx.y + altezzaNecessaria > PAGE_HEIGHT - 25) {
    ctx.doc.addPage()
    return { doc: ctx.doc, y: MARGIN + 5 }
  }
  return ctx
}

/** Disegna il titolo di una sezione: barra azzurra a piena larghezza con testo bianco, come il titolo principale. */
export function sezione(ctx: DocContext, titolo: string, compatta = false): DocContext {
  ctx = assicuraSpazio(ctx, compatta ? 10 : 16)
  const { doc } = ctx
  let { y } = ctx

  const altezzaBarra = compatta ? 4.8 : 7.5
  doc.setFillColor(...BLUE)
  doc.rect(MARGIN, y, CONTENT_WIDTH, altezzaBarra, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(compatta ? 8 : 10.5)
  doc.setTextColor(255, 255, 255)
  doc.text(titolo.toUpperCase(), MARGIN + 2.5, y + altezzaBarra * 0.7)

  return { doc, y: y + altezzaBarra + (compatta ? 1.8 : 5) }
}

/** Disegna una riga con più coppie label:valore distribuite su colonne (default 2). */
export function righeCampi(ctx: DocContext, coppie: [string, string][], colonne: 1 | 2 | 3 = 2, altezzaRiga = 9.0): DocContext {
  const { doc } = ctx
  let { y } = ctx
  const colWidth = CONTENT_WIDTH / colonne
  const righeTotali = Math.ceil(coppie.length / colonne)

  ctx = assicuraSpazio({ doc, y }, righeTotali * altezzaRiga + 3)
  y = ctx.y

  coppie.forEach(([label, valore], i) => {
    const col = i % colonne
    const riga = Math.floor(i / colonne)
    const x = MARGIN + col * colWidth
    const rowY = y + riga * altezzaRiga

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(altezzaRiga < 8 ? 7.3 : 8.5)
    doc.setTextColor(...GRAY)
    doc.text(label.toUpperCase(), x, rowY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(altezzaRiga < 8 ? 9 : 10.5)
    doc.setTextColor(...DARK)
    doc.text(valore || '—', x, rowY + (altezzaRiga < 8 ? 3.6 : 4.6))
  })

  return { doc, y: y + righeTotali * altezzaRiga + (altezzaRiga < 8 ? 2.5 : 4) }
}

/** Un blocco di testo libero (paragrafo), utile per clausole/note. */
export function paragrafo(ctx: DocContext, testo: string, opts?: { titolo?: string; fontSize?: number }): DocContext {
  const { doc } = ctx
  let { y } = ctx
  const fontSize = opts?.fontSize ?? 8.5
  const lineHeight = fontSize * 0.42 + 0.4 // proporzionale al font, non più un valore fisso

  if (opts?.titolo) {
    ctx = assicuraSpazio({ doc, y }, 10)
    y = ctx.y
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fontSize + 0.7)
    doc.setTextColor(...DARK)
    doc.text(opts.titolo, MARGIN, y)
    y += fontSize * 0.55 + 1
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  doc.setTextColor(60, 60, 60)
  const righe = doc.splitTextToSize(testo, CONTENT_WIDTH)

  ctx = assicuraSpazio({ doc, y }, righe.length * lineHeight + 4)
  y = ctx.y

  doc.text(righe, MARGIN, y)
  return { doc, y: y + righe.length * lineHeight + 4 }
}

/** Tabella semplice per checklist (es. esame tecnico, certificato conformità). */
export function tabellaChecklist(ctx: DocContext, righe: [string, string][]): DocContext {
  const { doc } = ctx
  let { y } = ctx

  ctx = assicuraSpazio({ doc, y }, righe.length * 6.5 + 4)
  y = ctx.y

  righe.forEach(([label, valore], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 250)
      doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 6, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(60, 60, 60)
    doc.text(label, MARGIN + 2, y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...DARK)
    doc.text(valore || '—', PAGE_WIDTH - MARGIN - 2, y, { align: 'right' })

    y += 6.5
  })

  return { doc, y: y + 3 }
}

/**
 * Stessa tabellaChecklist ma su 2 colonne affiancate (metà righe a sx, metà a dx),
 * per liste lunghe (es. valutazione organi) dove altrimenti la tabella occuperebbe
 * quasi un'intera pagina da sola.
 */
export function tabellaChecklistDueColonne(ctx: DocContext, righe: [string, string][]): DocContext {
  const { doc } = ctx
  const yIniziale = ctx.y

  const meta = Math.ceil(righe.length / 2)
  const colSx = righe.slice(0, meta)
  const colDx = righe.slice(meta)
  const righeMax = Math.max(colSx.length, colDx.length)

  ctx = assicuraSpazio({ doc, y: yIniziale }, righeMax * 5.8 + 4)
  const y = ctx.y

  const gap = 8
  const colWidth = (CONTENT_WIDTH - gap) / 2

  const disegnaColonna = (righeCol: [string, string][], xBase: number) => {
    let yy = y
    righeCol.forEach(([label, valore], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 249, 250)
        doc.rect(xBase, yy - 4, colWidth, 5.6, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(60, 60, 60)
      doc.text(label, xBase + 2, yy)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...DARK)
      doc.text(valore || '—', xBase + colWidth - 2, yy, { align: 'right' })

      yy += 5.8
    })
  }

  disegnaColonna(colSx, MARGIN)
  disegnaColonna(colDx, MARGIN + colWidth + gap)

  return { doc, y: y + righeMax * 5.8 + 3 }
}

/**
 * Griglia di caselle da spuntare a penna (☐ Label), su N colonne. Per moduli
 * pensati per essere stampati e compilati in sede, non per dati già noti a sistema.
 */
export function caselleCheck(ctx: DocContext, items: string[], colonne = 2, altezzaRiga = 8.5): DocContext {
  const { doc } = ctx
  let { y } = ctx
  const colWidth = CONTENT_WIDTH / colonne
  const righeTotali = Math.ceil(items.length / colonne)

  ctx = assicuraSpazio({ doc, y }, righeTotali * altezzaRiga + 4)
  y = ctx.y

  items.forEach((label, i) => {
    const col = i % colonne
    const riga = Math.floor(i / colonne)
    const x = MARGIN + col * colWidth
    const rowY = y + riga * altezzaRiga

    doc.setDrawColor(120, 120, 120)
    doc.setLineWidth(0.4)
    doc.rect(x, rowY - 3, 3.2, 3.2)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(altezzaRiga < 7 ? 7.5 : 9)
    doc.setTextColor(...DARK)
    doc.text(label, x + 5.5, rowY)
  })

  return { doc, y: y + righeTotali * altezzaRiga + 3 }
}

/**
 * Righe "Label ..........." con una linea vuota da compilare a penna, per schede
 * da stampare (esame visivo, note libere). Non un valore digitale precompilato.
 */
export function righeDaCompilare(ctx: DocContext, labels: string[], larghezzaLabel = 45, altezzaRiga = 9): DocContext {
  const { doc } = ctx
  let { y } = ctx

  ctx = assicuraSpazio({ doc, y }, labels.length * altezzaRiga + 4)
  y = ctx.y

  labels.forEach((label, i) => {
    const rowY = y + i * altezzaRiga
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(altezzaRiga < 7 ? 7.5 : 9)
    doc.setTextColor(...DARK)
    doc.text(label, MARGIN, rowY)

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(MARGIN + larghezzaLabel, rowY - 0.8, PAGE_WIDTH - MARGIN, rowY - 0.8)
  })

  return { doc, y: y + labels.length * altezzaRiga + 3 }
}

/**
 * Righe di verifica con esito SI/NO da spuntare a penna e una condizione
 * preimpostata (es. "Motore — Regolare  SI ☐ NO ☐"), più una linea vuota per note.
 * Per moduli di perizia stampati da compilare in sede, non valori digitali.
 */
export function checklistSiNo(ctx: DocContext, righe: { label: string; condizione: string }[], altezzaRiga = 9): DocContext {
  const { doc } = ctx
  let { y } = ctx

  ctx = assicuraSpazio({ doc, y }, righe.length * altezzaRiga + 4)
  y = ctx.y
  const fontSize = altezzaRiga < 7 ? 7.5 : 9

  righe.forEach(({ label, condizione }, i) => {
    const rowY = y + i * altezzaRiga
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    doc.setTextColor(...DARK)
    doc.text(label, MARGIN, rowY)

    const xCond = MARGIN + 44
    doc.text(condizione, xCond, rowY)

    const xSiNo = xCond + 26
    doc.setFontSize(fontSize - 0.5)
    doc.text('SI', xSiNo, rowY)
    doc.rect(xSiNo + 5.5, rowY - 2.8, 3, 3)
    doc.text('NO', xSiNo + 12, rowY)
    doc.rect(xSiNo + 19.5, rowY - 2.8, 3, 3)

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(xSiNo + 27, rowY - 0.8, PAGE_WIDTH - MARGIN, rowY - 0.8)
  })

  return { doc, y: y + righe.length * altezzaRiga + 3 }
}

/**
 * Riga "Scadenza bollo" (data o linea vuota da compilare) + riga "IVA TOTALE/PARZIALE"
 * (caselle, spuntata quella nota se il dato è già a sistema). Righe particolari del
 * modulo standard permuta che non seguono il pattern semplice di caselleCheck.
 */
export function righeScadenzaBolloEIva(
  ctx: DocContext,
  scadenzaBolloFormattata: string | null | undefined,
  ivaTipo: 'totale' | 'parziale' | null | undefined,
  altezzaRiga = 8.5
): DocContext {
  const { doc } = ctx
  let { y } = ctx

  ctx = assicuraSpazio({ doc, y }, altezzaRiga * 2 + 4)
  y = ctx.y

  // Riga 1: Scadenza bollo
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('Scadenza bollo', MARGIN, y)
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  const xLineaBollo = MARGIN + 32
  if (scadenzaBolloFormattata && scadenzaBolloFormattata !== '—') {
    doc.setFont('helvetica', 'bold')
    doc.text(scadenzaBolloFormattata, xLineaBollo + 2, y)
  } else {
    doc.line(xLineaBollo, y - 0.8, xLineaBollo + 45, y - 0.8)
  }

  // Riga 2: IVA — TOTALE / PARZIALE
  const y2 = y + altezzaRiga
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text('IVA', MARGIN, y2)

  const disegnaCasella = (label: string, x: number, selezionata: boolean) => {
    doc.setFontSize(9)
    doc.text(label, x, y2)
    const xBox = x + doc.getTextWidth(label) + 2
    doc.rect(xBox, y2 - 3, 3.2, 3.2)
    if (selezionata) {
      doc.setLineWidth(0.5)
      doc.line(xBox, y2 - 3, xBox + 3.2, y2)
      doc.line(xBox, y2, xBox + 3.2, y2 - 3)
    }
    return xBox + 3.2
  }

  const xDopoTotale = disegnaCasella('TOTALE', MARGIN + 12, ivaTipo === 'totale')
  disegnaCasella('PARZIALE', xDopoTotale + 8, ivaTipo === 'parziale')

  return { doc, y: y2 + 5 }
}

/** Righe firma affiancate in fondo al documento. */
export function firme(ctx: DocContext, labels: string[]): DocContext {
  ctx = assicuraSpazio(ctx, 18)
  const { doc } = ctx
  let { y } = ctx
  y += 7

  const colWidth = CONTENT_WIDTH / labels.length
  labels.forEach((label, i) => {
    const x = MARGIN + i * colWidth
    doc.setDrawColor(180, 180, 180)
    doc.line(x, y, x + colWidth - 10, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(label, x, y + 4)
  })

  return { doc, y: y + 10 }
}

/** Footer legale su tutte le pagine: sede legale, P.IVA, REA. Va chiamato per ultimo, prima di salvare. */
export function applicaFooterLegale(doc: jsPDF) {
  const pagine = doc.getNumberOfPages()
  for (let i = 1; i <= pagine; i++) {
    doc.setPage(i)
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, PAGE_HEIGHT - 18, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.text(
      `${AZIENDA.ragioneSociale} • Sede legale: ${AZIENDA.indirizzoLegale}, ${AZIENDA.capCittaLegale} • P.IVA/CF ${AZIENDA.piva} • REA ${AZIENDA.rea} • Cap. soc. ${AZIENDA.capitaleSociale}`,
      MARGIN,
      PAGE_HEIGHT - 14
    )
    doc.text(`Pagina ${i} di ${pagine}`, MARGIN, PAGE_HEIGHT - 10)
  }
}

/**
 * Variante di intestazione con il titolo del documento in una barra colorata IN CIMA
 * (sopra il logo), come nel modulo originale del Contratto di Vendita.
 */
export function creaDocumentoTitoloSopra(titolo: string, sottotitolo?: string, numeroContratto?: string | null): DocContext {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const altezzaBarra = sottotitolo ? 20 : 16

  doc.setFillColor(...BLUE)
  doc.rect(0, 0, PAGE_WIDTH, altezzaBarra, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text(titolo, PAGE_WIDTH / 2, sottotitolo ? 10 : 10, { align: 'center' })

  if (sottotitolo) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(sottotitolo, PAGE_WIDTH / 2, 16, { align: 'center' })
  }

  let y = altezzaBarra + 10

  const logoWidth = 36
  const logoHeight = logoWidth * LOGO_ASPECT
  doc.addImage(LOGO_PDF, 'PNG', MARGIN, y - 7, logoWidth, logoHeight)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAY)
  doc.text(AZIENDA.claim, MARGIN, y - 7 + logoHeight + 4)

  doc.setFontSize(8)
  doc.text(AZIENDA.indirizzoShowroom, PAGE_WIDTH - MARGIN, y - 6, { align: 'right' })
  doc.text(AZIENDA.capCittaShowroom, PAGE_WIDTH - MARGIN, y - 2, { align: 'right' })
  if (rigaContattiPdf()) doc.text(rigaContattiPdf(), PAGE_WIDTH - MARGIN, y + 2, { align: 'right' })

  if (numeroContratto) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...BLUE)
    doc.text(`Contratto N. ${numeroContratto}`, PAGE_WIDTH - MARGIN, y + 7, { align: 'right' })
  }

  y += 10
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)

  return { doc, y: y + 8 }
}

/**
 * Header minimo per documenti molto densi che devono stare in 1 pagina (es. moduli
 * standard di settore ristampati): solo banner titolo + numero contratto, niente
 * logo/tagline/indirizzo esteso come in creaDocumentoTitoloSopra. Risparmia ~25mm.
 */
export function creaDocumentoTitoloCompatto(titolo: string, numeroContratto?: string | null): DocContext {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const altezzaBarra = 11
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, PAGE_WIDTH, altezzaBarra, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.setTextColor(255, 255, 255)
  doc.text(titolo, PAGE_WIDTH / 2, altezzaBarra / 2 + 2.2, { align: 'center' })

  if (numeroContratto) {
    doc.setFontSize(8)
    doc.text(`Contratto N. ${numeroContratto}`, PAGE_WIDTH - MARGIN, altezzaBarra / 2 + 2.2, { align: 'right' })
  }

  return { doc, y: altezzaBarra + 6 }
}

/**
 * Come schemaVeicolo(), ma icone piccole in riga unica senza etichette né riquadro:
 * per documenti dove serve solo un riferimento visivo compatto (es. scheda permuta
 * a 1 pagina), non la vista principale del documento.
 */
export function schemaVeicoloCompatto(ctx: DocContext): DocContext {
  const { doc } = ctx
  let { y } = ctx
  ctx = assicuraSpazio({ doc, y }, 20)
  y = ctx.y

  const viste = [
    { img: ICONA_FRONTE, ratio: ICONA_FRONTE_RATIO },
    { img: ICONA_LATERALE_SX, ratio: ICONA_LATERALE_SX_RATIO },
    { img: ICONA_RETRO, ratio: ICONA_RETRO_RATIO },
    { img: ICONA_LATERALE_DX, ratio: ICONA_LATERALE_SX_RATIO },
  ]
  const cellH = 11
  const gap = 3
  const cellW = (CONTENT_WIDTH - gap * 3) / 4

  viste.forEach(({ img, ratio }, i) => {
    const x = MARGIN + i * (cellW + gap)
    let w = cellW
    let h = w / ratio
    if (h > cellH) {
      h = cellH
      w = h * ratio
    }
    doc.addImage(img, 'PNG', x + (cellW - w) / 2, y, w, h, undefined, 'MEDIUM')
  })

  return { doc, y: y + cellH + 4 }
}

/** Due blocchi affiancati (es. veicolo acquistato / veicolo in permuta), ciascuno con titolo e lista campi. */
export function duale(
  ctx: DocContext,
  sinistra: { titolo: string; campi: [string, string][] },
  destra: { titolo: string; campi: [string, string][] }
): DocContext {
  const { doc } = ctx
  let { y } = ctx
  const colGap = 8
  const colWidth = (CONTENT_WIDTH - colGap) / 2
  const colX = [MARGIN, MARGIN + colWidth + colGap]
  const altezzaRiga = 7.8 // era 8.5, stretto un filo per guadagnare spazio
  const righeMax = Math.max(sinistra.campi.length, destra.campi.length)

  ctx = assicuraSpazio({ doc, y }, righeMax * altezzaRiga + 18)
  y = ctx.y

  ;[sinistra, destra].forEach((blocco, i) => {
    const x = colX[i]
    doc.setFillColor(...BLUE)
    doc.rect(x, y, colWidth, 6.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(255, 255, 255)
    doc.text(blocco.titolo.toUpperCase(), x + 2.5, y + 4.6)
  })

  const cursorY = y + 6.5 + 6
  ;[sinistra, destra].forEach((blocco, i) => {
    const x = colX[i]
    let ry = cursorY
    blocco.campi.forEach(([label, valore]) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.8)
      doc.setTextColor(...GRAY)
      doc.text(label.toUpperCase(), x, ry)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.8)
      doc.setTextColor(...DARK)
      doc.text(valore || '—', x, ry + 4.2)
      ry += altezzaRiga
    })
  })

  return { doc, y: cursorY + righeMax * altezzaRiga + 5 }
}

/**
 * Come duale(), ma ogni lato è a sua volta diviso in 2 sotto-colonne (quindi 4 colonne
 * totali sulla pagina). Utile quando entrambe le liste hanno voci corte (Sì/No, valutazioni
 * brevi tipo "Regolare"/"Sostituita") e il doppio pannello a colonna singola sprecherebbe
 * troppa altezza.
 */
export function dualeQuattroColonne(
  ctx: DocContext,
  sinistra: { titolo: string; campi: [string, string][] },
  destra: { titolo: string; campi: [string, string][] }
): DocContext {
  const { doc } = ctx
  let { y } = ctx
  const colGap = 8
  const colWidth = (CONTENT_WIDTH - colGap) / 2
  const colX = [MARGIN, MARGIN + colWidth + colGap]
  const subGap = 5
  const subColWidth = (colWidth - subGap) / 2
  const altezzaRiga = 7.5 // le etichette note sono tutte corte ora; lo split automatico resta come rete di sicurezza

  const righeSinistra = Math.ceil(sinistra.campi.length / 2)
  const righeDestra = Math.ceil(destra.campi.length / 2)
  const righeMax = Math.max(righeSinistra, righeDestra)

  ctx = assicuraSpazio({ doc, y }, righeMax * altezzaRiga + 18)
  y = ctx.y

  ;[sinistra, destra].forEach((blocco, i) => {
    const x = colX[i]
    doc.setFillColor(...BLUE)
    doc.rect(x, y, colWidth, 6.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(255, 255, 255)
    doc.text(blocco.titolo.toUpperCase(), x + 2.5, y + 4.6)
  })

  const cursorY = y + 6.5 + 6
  ;[sinistra, destra].forEach((blocco, i) => {
    const xBase = colX[i]
    blocco.campi.forEach(([label, valore], idx) => {
      const sub = idx % 2
      const riga = Math.floor(idx / 2)
      const x = xBase + sub * (subColWidth + subGap)
      const ry = cursorY + riga * altezzaRiga

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...GRAY)
      // Etichette lunghe vanno a capo invece di sforare nella sotto-colonna accanto
      // (successo con "Parti elettriche/elettroniche" alla larghezza piena).
      const labelRighe = doc.splitTextToSize(label.toUpperCase(), subColWidth)
      doc.text(labelRighe, x, ry)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.3)
      doc.setTextColor(...DARK)
      doc.text(valore || '—', x, ry + 3.6 + (labelRighe.length - 1) * 3)
    })
  })

  return { doc, y: cursorY + righeMax * altezzaRiga + 5 }
}

/** Una riga con un solo campo (tutta larga) oppure due campi affiancati, per dualeCompatto. */
export type RigaCompatta = [string, string] | [[string, string], [string, string]]

/**
 * Come duale(), ma ogni riga può contenere UNO o DUE campi affiancati (es. "Marca" e "Modello"
 * sulla stessa riga), per risparmiare spazio verticale quando i valori sono corti.
 * Usare una riga a campo singolo per valori che possono essere lunghi (es. Versione).
 */
export function dualeCompatto(
  ctx: DocContext,
  sinistra: { titolo: string; righe: RigaCompatta[] },
  destra: { titolo: string; righe: RigaCompatta[] }
): DocContext {
  const { doc } = ctx
  let { y } = ctx
  const colGap = 8
  const colWidth = (CONTENT_WIDTH - colGap) / 2
  const colX = [MARGIN, MARGIN + colWidth + colGap]
  const altezzaRiga = 8.5
  const righeMax = Math.max(sinistra.righe.length, destra.righe.length)

  ctx = assicuraSpazio({ doc, y }, righeMax * altezzaRiga + 18)
  y = ctx.y

  ;[sinistra, destra].forEach((blocco, i) => {
    const x = colX[i]
    doc.setFillColor(...BLUE)
    doc.rect(x, y, colWidth, 6.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(255, 255, 255)
    doc.text(blocco.titolo.toUpperCase(), x + 2.5, y + 4.6)
  })

  const cursorY = y + 6.5 + 6
  ;[sinistra, destra].forEach((blocco, i) => {
    const x = colX[i]
    let ry = cursorY

    blocco.righe.forEach((riga) => {
      const eDoppia = Array.isArray(riga[0])

      if (eDoppia) {
        const coppia = riga as [string, string][]
        const subColWidth = (colWidth - 5) / 2
        coppia.forEach(([label, valore], j) => {
          const subX = x + j * (subColWidth + 5)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(...GRAY)
          doc.text(label.toUpperCase(), subX, ry)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9.3)
          doc.setTextColor(...DARK)
          doc.text(valore || '—', subX, ry + 4.2)
        })
      } else {
        const [label, valore] = riga as [string, string]
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.8)
        doc.setTextColor(...GRAY)
        doc.text(label.toUpperCase(), x, ry)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.8)
        doc.setTextColor(...DARK)
        doc.text(valore || '—', x, ry + 4.2)
      }

      ry += altezzaRiga
    })
  })

  return { doc, y: cursorY + righeMax * altezzaRiga + 5 }
}

/**
 * Pagina dedicata con clausole disposte su due colonne dense (font più piccolo),
 * per far stare tutte le condizioni generali su un unico foglio come nel modulo originale.
 * Apre sempre una pagina nuova.
 */
export function paginaClausoleDueColonne(
  doc: jsPDF,
  titoloPagina: string,
  clausole: { titolo: string; testo: string }[],
  fontSize = 9.3
): DocContext {
  doc.addPage()
  let y = MARGIN + 5

  // Banner blu coerente con lo stile "sezione()" usato nel resto dei documenti
  // (prima era un titolo nero + riga blu sotto, stonava rispetto alle altre pagine).
  doc.setFillColor(...BLUE)
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(titoloPagina.toUpperCase(), MARGIN + 3, y + 6)
  y += 8.5 + 7

  const colGap = 8
  const colWidth = (CONTENT_WIDTH - colGap) / 2
  const colX = [MARGIN, MARGIN + colWidth + colGap]
  const maxY = PAGE_HEIGHT - 40 // spazio ampio per le clausole, ma con margine di sicurezza prima del footer per la firma che segue subito dopo

  // Bilanciamento per ALTEZZA stimata (greedy: ogni clausola va nella colonna più
  // "leggera" al momento), non per numero di clausole: con un conteggio secco una
  // singola clausola più lunga delle altre (es. un articolo con più dettagli) può
  // sforare da sola la colonna, lasciando l'altra vuota o disallineata.
  const clausoleConAltezza = clausole.map((c) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fontSize + 1)
    const titoloRighe = doc.splitTextToSize(c.titolo, colWidth)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    const testoRighe = doc.splitTextToSize(c.testo, colWidth)

    const altezza = titoloRighe.length * 4.8 + testoRighe.length * 4.4 + 5.5
    return { ...c, titoloRighe, testoRighe, altezza }
  })

  const colonne: (typeof clausoleConAltezza)[] = [[], []]
  const altezzeColonne = [0, 0]
  clausoleConAltezza.forEach((c) => {
    const col = altezzeColonne[0] <= altezzeColonne[1] ? 0 : 1
    colonne[col].push(c)
    altezzeColonne[col] += c.altezza
  })

  let colY = [y, y]

  colonne.forEach((clausoleColonna, col) => {
    clausoleColonna.forEach(({ titoloRighe, testoRighe, altezza }) => {
      if (colY[col] + altezza > maxY) {
        doc.addPage()
        colY[col] = MARGIN + 5
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(fontSize + 1)
      doc.setTextColor(...DARK)
      doc.text(titoloRighe, colX[col], colY[col])
      colY[col] += titoloRighe.length * 4.8 + 1.8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(50, 50, 50)
      doc.text(testoRighe, colX[col], colY[col])
      colY[col] += testoRighe.length * 4.4 + 5.5
    })
  })

  return { doc, y: Math.max(colY[0], colY[1]) + 4 }
}

/** Riquadro firma con bordo vero (non solo una linea), come nei moduli originali. */
export function firmaConRiquadro(ctx: DocContext, label: string, altezza = 20): DocContext {
  ctx = assicuraSpazio(ctx, altezza + 10)
  const { doc } = ctx
  let { y } = ctx

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.rect(MARGIN, y, CONTENT_WIDTH, altezza)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text(label, MARGIN + 3, y + altezza + 4)

  return { doc, y: y + altezza + 8 }
}

/** Firma raccolta su tablet: se impostata, viene stampata nel riquadro "Acquirente" dei contratti. */
let firmaAcquirentePng: string | null = null
export function impostaFirmaAcquirente(png: string | null) {
  firmaAcquirentePng = png
}

export const haFirmaAcquirente = () => firmaAcquirentePng != null

/** Stampa la firma raccolta sopra una riga di firma (x, y della riga, larghezza utile). */
function stampaFirmaSuRiga(doc: jsPDF, x: number, yRiga: number, larghezza: number, altezzaMax = 11) {
  if (!firmaAcquirentePng) return
  const props = doc.getImageProperties(firmaAcquirentePng)
  const sc = Math.min(larghezza / props.width, altezzaMax / props.height)
  const w = props.width * sc
  const h = props.height * sc
  doc.addImage(firmaAcquirentePng, 'PNG', x, yRiga - h - 0.5, w, h)
}

/** Due riquadri firma affiancati (es. Firma Acquirente | Timbro e Firma azienda). */
export function firmeDoppieConRiquadro(ctx: DocContext, labelSx: string, labelDx: string, altezza = 22): DocContext {
  ctx = assicuraSpazio(ctx, altezza + 10)
  const { doc } = ctx
  let { y } = ctx
  const colGap = 8
  const colWidth = (CONTENT_WIDTH - colGap) / 2

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.rect(MARGIN, y, colWidth, altezza)
  doc.rect(MARGIN + colWidth + colGap, y, colWidth, altezza)

  if (firmaAcquirentePng && /acquirente/i.test(labelSx)) {
    // Mantiene le proporzioni della firma dentro il riquadro
    const props = doc.getImageProperties(firmaAcquirentePng)
    const maxW = colWidth - 6
    const maxH = altezza - 4
    const sc = Math.min(maxW / props.width, maxH / props.height)
    const w = props.width * sc
    const h = props.height * sc
    doc.addImage(firmaAcquirentePng, 'PNG', MARGIN + (colWidth - w) / 2, y + (altezza - h) / 2, w, h)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(150, 150, 150)
    doc.text(`Firmato su tablet il ${new Date().toLocaleString('it-IT')}`, MARGIN + 2, y + altezza - 1.5)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text(labelSx, MARGIN + 3, y + altezza + 4)
  doc.text(labelDx, MARGIN + colWidth + colGap + 3, y + altezza + 4)

  return { doc, y: y + altezza + 8 }
}

/** Tre riquadri firma affiancati in un'unica riga (es. Letto e accettato A/B/C). */
export function firmeTripleConRiquadro(ctx: DocContext, labels: [string, string, string], altezza = 14): DocContext {
  ctx = assicuraSpazio(ctx, altezza + 10)
  const { doc } = ctx
  let { y } = ctx
  const gap = 6
  const colWidth = (CONTENT_WIDTH - gap * 2) / 3

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  labels.forEach((_, i) => {
    const x = MARGIN + i * (colWidth + gap)
    doc.rect(x, y, colWidth, altezza)
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  labels.forEach((label, i) => {
    const x = MARGIN + i * (colWidth + gap)
    doc.text(label, x + 2, y + altezza + 4)
  })

  return { doc, y: y + altezza + 8 }
}

/**
 * Disegno delle 4 viste dell'auto (fronte/laterale/retro), stessa posizione/impaginazione
 * di prima, ma ora con icone vere (illustrazioni vettoriali convertite in immagine)
 * al posto delle forme geometriche disegnate a mano.
 */
export function schemaVeicolo(ctx: DocContext): DocContext {
  ctx = assicuraSpazio(ctx, 45)
  const { doc } = ctx
  let { y } = ctx

  const viste: { label: string; img: string; ratio: number }[] = [
    { label: 'Anteriore', img: ICONA_FRONTE, ratio: ICONA_FRONTE_RATIO },
    { label: 'Laterale SX', img: ICONA_LATERALE_SX, ratio: ICONA_LATERALE_SX_RATIO },
    { label: 'Posteriore', img: ICONA_RETRO, ratio: ICONA_RETRO_RATIO },
    { label: 'Laterale DX', img: ICONA_LATERALE_DX, ratio: ICONA_LATERALE_SX_RATIO },
  ]
  const cellW = CONTENT_WIDTH / 4 - 4
  const cellH = 30

  viste.forEach(({ label, img, ratio }, i) => {
    const x = MARGIN + i * (cellW + 5)

    doc.setDrawColor(...BLUE)
    doc.setLineWidth(0.4)
    doc.setFillColor(248, 249, 250)
    doc.roundedRect(x, y, cellW, cellH, 2, 2, 'FD')

    // Adatta l'immagine dentro la cella mantenendo le proporzioni, centrata.
    const pad = 3
    const maxW = cellW - pad * 2
    const maxH = cellH - pad * 2
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    const imgX = x + (cellW - w) / 2
    const imgY = y + (cellH - h) / 2
    doc.addImage(img, 'PNG', imgX, imgY, w, h, undefined, 'MEDIUM')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(label, x + cellW / 2, y + cellH + 4, { align: 'center' })
  })

  return { doc, y: y + cellH + 10 }
}

/**
 * Box "Note" con righe orizzontali dentro, dimensionato per riempire lo spazio
 * rimasto fino a un'altezza target (di solito: fino a poco prima delle firme,
 * così la pagina risulta piena invece di finire con un vuoto).
 * Nota: non ricontrolla lo spazio da sola (a differenza delle altre funzioni) perché
 * l'altezza le viene già passata calcolata con precisione da chi la chiama.
 */
export function boxNoteARighe(ctx: DocContext, altezzaBox: number): DocContext {
  const { doc } = ctx
  let { y } = ctx

  doc.setFillColor(...BLUE)
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(255, 255, 255)
  doc.text('NOTE', MARGIN + 3, y + 5.3)
  y += 7.5

  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.2)

  const interlinea = 7
  const numRighe = Math.max(2, Math.floor((altezzaBox - 7.5) / interlinea))
  for (let i = 1; i <= numRighe; i++) {
    doc.line(MARGIN, y + i * interlinea, PAGE_WIDTH - MARGIN, y + i * interlinea)
  }

  return { doc, y: y + (altezzaBox - 7.5) }
}

/**
 * Blocco finale di pagina 1: luogo/data + firma acquirente + timbro e firma azienda,
 * come nel modulo originale del Contratto di Vendita.
 * Nota: come sopra, non ricontrolla lo spazio da sola: chi la chiama in
 * generaContrattoVendita riserva già l'altezza esatta che occupa (vedi ALTEZZA_FIRMA_PAGINA1).
 */
export const ALTEZZA_FIRMA_PAGINA1 = 14 // mm occupati realmente da questo blocco, da riservare a monte

export function blocchettoFirmaPagina1(ctx: DocContext): DocContext {
  const { doc } = ctx
  let { y } = ctx
  // Con la firma su tablet il box note è più basso (vedi generaContrattoVendita): qui lascio lo spazio per la firma
  y += haFirmaAcquirente() ? 12 : 4

  const colGap = 6
  const colWidth = (CONTENT_WIDTH - colGap * 2) / 3
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  stampaFirmaSuRiga(doc, MARGIN + colWidth + colGap, y, colWidth - 6)
  doc.line(MARGIN, y, MARGIN + colWidth - 6, y)
  doc.line(MARGIN + colWidth + colGap, y, MARGIN + (colWidth + colGap) + colWidth - 6, y)
  doc.line(MARGIN + (colWidth + colGap) * 2, y, MARGIN + (colWidth + colGap) * 2 + colWidth - 6, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('Luogo e data', MARGIN, y + 4)
  doc.text('Firma Acquirente', MARGIN + colWidth + colGap, y + 4)
  doc.text(`Timbro e Firma ${AZIENDA.ragioneSociale}`, MARGIN + (colWidth + colGap) * 2, y + 4)

  return { doc, y: y + 10 }
}

/** Firma singola del cliente + luogo/data, per le pagine con un solo firmatario (condizioni generali, privacy). */
export function firmaSingolaConData(ctx: DocContext): DocContext {
  const { doc } = ctx
  let { y } = ctx
  y += 8

  const colGap = 8
  const colWidth = (CONTENT_WIDTH - colGap) / 2
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  stampaFirmaSuRiga(doc, MARGIN, y, colWidth - 10)
  doc.line(MARGIN, y, MARGIN + colWidth - 10, y)
  doc.line(MARGIN + colWidth + colGap, y, MARGIN + colWidth + colGap + colWidth - 10, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('Firma Cliente', MARGIN, y + 4)
  doc.text('Data e Luogo', MARGIN + colWidth + colGap, y + 4)

  return { doc, y: y + 10 }
}

export function scarica(doc: jsPDF, nomeFile: string) {
  applicaFooterLegale(doc)
  doc.save(nomeFile)
}