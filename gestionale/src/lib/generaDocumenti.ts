import { creaDocumentoTitoloSopra, creaDocumentoTitoloCompatto, sezione, righeCampi, duale, dualeCompatto, dualeQuattroColonne, paragrafo, tabellaChecklist, tabellaChecklistDueColonne, caselleCheck, righeDaCompilare, checklistSiNo, righeScadenzaBolloEIva, paginaClausoleDueColonne, firme, firmaConRiquadro, firmeDoppieConRiquadro, firmeTripleConRiquadro, schemaVeicolo, schemaVeicoloCompatto, boxNoteARighe, blocchettoFirmaPagina1, firmaSingolaConData, scarica, assicuraSpazio } from './pdfHelpers'
import { salvaInArchivio } from './archivioDocumenti'
import { AZIENDA } from './companyInfo'
import { calcolaRataMensile } from './finanziamento'

// Tipo con tutti i campi che questi documenti possono usare (base annuncio + campi vendita/tecnici).
// Tutti opzionali tranne i dati auto base: se un campo non è compilato, viene semplicemente
// mostrato vuoto ("—") sul PDF, non blocca mai la generazione.
export interface AnnuncioDocumenti {
  id: string
  numero_contratto?: string | null
  marca: string
  modello: string
  versione?: string | null
  prezzo: number
  condizione: string
  immatricolazione_mese?: number | null
  immatricolazione_anno?: number | null
  km: number
  alimentazione: string
  cambio: string
  colore?: string | null
  carrozzeria?: string | null
  classe_emissioni?: string | null
  cv?: number | null
  cilindrata_cc?: number | null
  accessori?: string[] | null
  note_documento?: string | null

  targa?: string | null
  numero_telaio?: string | null
  provenienza?: string | null
  numero_proprietari?: number | null
  numero_mini_pass?: number | null
  ultima_manutenzione_km?: number | null
  ultima_manutenzione_data?: string | null
  scadenza_revisione?: string | null
  scadenza_bollo?: string | null
  km_alla_consegna?: number | null

  dotazioni?: {
    carnet_tagliandi?: boolean
    tagliandi_regolari?: boolean
    ruota_scorta?: boolean
    attrezzatura_emergenza?: boolean
    chiavi_scorta?: boolean
    carta_circolazione?: boolean
    libretto_circolazione?: boolean
    cdp?: boolean
    iva?: boolean
    numero_chiavi_consegnate?: number
  } | null

  esame_tecnico?: Record<string, string> | null
  certificato_conformita?: Record<string, string> | null
  prova_strada_acquirente?: boolean | null

  cliente_nome?: string | null
  cliente_cognome?: string | null
  cliente_data_nascita?: string | null
  cliente_luogo_nascita?: string | null
  cliente_indirizzo?: string | null
  cliente_cap?: string | null
  cliente_citta?: string | null
  cliente_provincia?: string | null
  cliente_cellulare?: string | null
  cliente_telefono?: string | null
  cliente_email?: string | null
  cliente_codice_fiscale?: string | null
  cliente_piva?: string | null
  cliente_professione?: string | null

  permuta_marca?: string | null
  permuta_modello?: string | null
  permuta_versione?: string | null
  permuta_targa?: string | null
  permuta_anno?: number | null
  permuta_km?: number | null
  permuta_valore?: number | null
  permuta_passaggio_proprieta_costo?: number | null
  permuta_cc?: number | null
  permuta_alimentazione?: string | null
  permuta_colore?: string | null
  permuta_numero_telaio?: string | null
  permuta_scadenza_revisione?: string | null
  permuta_numero_proprietari?: number | null
  permuta_immatricolazione_mese?: number | null
  permuta_ultima_manutenzione_km?: number | null
  permuta_ultima_manutenzione_data?: string | null
  permuta_scadenza_bollo?: string | null
  permuta_iva_tipo?: 'totale' | 'parziale' | null

  prezzo_finale_vendita?: number | null
  garanzia_aggiuntiva_mesi?: number | null
  caparra_penitenziale?: number | null
  saldo_da_versare?: number | null
  richiesta_finanziamento?: string | null
  modalita_pagamento?: string | null
  finanziamento_tan?: number | null
  finanziamento_importo?: number | null
  finanziamento_rate?: number | null
  data_consegna_prevista?: string | null
}

function euro(v?: number | null): string {
  if (v === null || v === undefined) return '—'
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v)
}

function data(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  const anno = d.getFullYear()
  // Se la data non è valida o l'anno è palesemente sbagliato (es. digitato male nel form),
  // meglio mostrare "—" che una data assurda tipo 14/01/91996.
  if (isNaN(d.getTime()) || anno < 1900 || anno > 2100) return '—'
  return d.toLocaleDateString('it-IT')
}

function nomeAuto(a: AnnuncioDocumenti): string {
  return `${a.marca} ${a.versione || a.modello}`
}

// Caselle di spunta in stile modulo originale (usiamo [X]/[ ] invece di simboli Unicode ☑/☐,
// che il font Helvetica di jsPDF non renderizza in modo affidabile).
function formattaMetodoPagamento(selezionato?: string | null): string {
  const opzioni = ['Contanti', 'Bonifico', 'POS', 'Assegno']
  return opzioni.map((o) => `${o === selezionato ? '[X]' : '[ ]'} ${o}`).join('   ')
}

function formattaResidenza(a: AnnuncioDocumenti): string {
  const via = a.cliente_indirizzo || ''
  const cap = a.cliente_cap || ''
  const citta = a.cliente_citta || ''
  const prov = a.cliente_provincia || ''

  if (!via && !cap && !citta && !prov) return '—'

  const base = [via, cap, citta].filter(Boolean).join(' ')
  return prov ? `${base} (${prov})`.trim() : base || '—'
}

function labelDotazione(v?: boolean): string {
  return v ? 'Sì' : v === false ? 'No' : '—'
}

// =====================================================
// 1. CONTRATTO DI VENDITA
// =====================================================
export function generaContrattoVendita(a: AnnuncioDocumenti) {
  // =====================================================
  // PAGINA 1 — Tutti i dati della trattativa
  // =====================================================
  let ctx = creaDocumentoTitoloSopra(
    'CONTRATTO DI VENDITA',
    'Ai sensi del Codice del Consumo — D.Lgs. 6 settembre 2005, n. 206',
    a.numero_contratto
  )

  ctx = sezione(ctx, 'Dati Acquirente')
  ctx = righeCampi(ctx, [
    ['Nome e Cognome', `${a.cliente_nome || ''} ${a.cliente_cognome || ''}`.trim() || '—'],
    ['Codice Fiscale', a.cliente_codice_fiscale || '—'],
    ['Nato/a a', a.cliente_luogo_nascita || '—'],
    ['Data di nascita', data(a.cliente_data_nascita)],
    ['Residenza', formattaResidenza(a)],
    ['Cellulare', a.cliente_cellulare || '—'],
    ['Email', a.cliente_email || '—'],
    ['Professione', a.cliente_professione || '—'],
  ])

  if (a.permuta_marca) {
    ctx = dualeCompatto(
      ctx,
      {
        titolo: 'Dati del Veicolo',
        righe: [
          [['Marca', a.marca], ['Modello', a.modello]],
          ['Versione', a.versione || '—'],
          [['Numero Telaio', a.numero_telaio || '—'], ['Colore', a.colore || '—']],
          [['Targa / Anno', `${a.targa || '—'}  /  ${a.immatricolazione_anno || '—'}`], ['Km da tachimetro', `${a.km_alla_consegna ?? a.km} km`]],
          [
            ['Prezzo pattuito (IVA inclusa)', euro(a.prezzo_finale_vendita ?? a.prezzo)],
            ['Garanzia aggiuntiva', a.garanzia_aggiuntiva_mesi ? `${a.garanzia_aggiuntiva_mesi} mesi` : '—'],
          ],
        ],
      },
      {
        titolo: 'Veicolo in Permuta',
        righe: [
          [['Marca', a.permuta_marca], ['Modello', a.permuta_modello || '—']],
          ['Versione', a.permuta_versione || '—'],
          [['Targa / Anno', `${a.permuta_targa || '—'}  /  ${a.permuta_anno || '—'}`], ['Km da tachimetro', a.permuta_km ? `${a.permuta_km} km` : '—']],
          [
            ['Valore del veicolo', euro(a.permuta_valore)],
            ['Passaggio proprietà (costo)', euro(a.permuta_passaggio_proprieta_costo)],
          ],
        ],
      }
    )
  } else {
    // Niente permuta: niente senso tenere una colonna vuota affiancata che spreca
    // spazio quanto quella piena. Dati del Veicolo va a piena larghezza, 2 campi per riga.
    ctx = sezione(ctx, 'Dati del Veicolo')
    ctx = righeCampi(
      ctx,
      [
        ['Marca', a.marca],
        ['Modello', a.modello],
        ['Versione', a.versione || '—'],
        ['Numero Telaio', a.numero_telaio || '—'],
        ['Targa / Anno', `${a.targa || '—'}  /  ${a.immatricolazione_anno || '—'}`],
        ['Km da tachimetro', `${a.km_alla_consegna ?? a.km} km`],
        ['Colore', a.colore || '—'],
        ['Prezzo pattuito (IVA inclusa)', euro(a.prezzo_finale_vendita ?? a.prezzo)],
        ['Garanzia aggiuntiva', a.garanzia_aggiuntiva_mesi ? `${a.garanzia_aggiuntiva_mesi} mesi` : '—'],
      ],
      2
    )
  }

  const finanziamentoRichiesto = Boolean(a.richiesta_finanziamento && a.richiesta_finanziamento !== 'Nessuno')

  if (finanziamentoRichiesto) {
    ctx = duale(
      ctx,
      {
        titolo: 'Modalità di Pagamento',
        campi: [
          ['Prezzo pattuito', euro(a.prezzo_finale_vendita ?? a.prezzo)],
          ['Valore del veicolo in permuta', a.permuta_marca ? euro(a.permuta_valore) : '—'],
          ['Caparra penitenziale', euro(a.caparra_penitenziale)],
          ['Metodo di pagamento', formattaMetodoPagamento(a.modalita_pagamento)],
          ['Saldo da versare', euro(a.saldo_da_versare)],
        ],
      },
      {
        titolo: 'Richiesta Finanziamento',
        campi: [
          ['Tipologia', a.richiesta_finanziamento || '—'],
          ['Importo finanziato', a.finanziamento_importo ? euro(a.finanziamento_importo) : '—'],
          ['N° rate mensili', String(a.finanziamento_rate ?? '—')],
          [
            'Rata mensile stimata',
            a.finanziamento_importo && a.finanziamento_rate
              ? euro(calcolaRataMensile(a.finanziamento_importo, a.finanziamento_tan || 0, a.finanziamento_rate))
              : '—',
          ],
        ],
      }
    )
  } else {
    // Niente finanziamento: Modalità di Pagamento a piena larghezza, niente colonna vuota affiancata.
    ctx = sezione(ctx, 'Modalità di Pagamento')
    ctx = righeCampi(ctx, [
      ['Prezzo pattuito', euro(a.prezzo_finale_vendita ?? a.prezzo)],
      ['Valore del veicolo in permuta', a.permuta_marca ? euro(a.permuta_valore) : '—'],
      ['Caparra penitenziale', euro(a.caparra_penitenziale)],
      ['Metodo di pagamento', formattaMetodoPagamento(a.modalita_pagamento)],
      ['Saldo da versare', euro(a.saldo_da_versare)],
    ])
  }

  // Box note: altezza fissa (non più calcolata "per riempire esattamente"), sempre presente.
  // I calcoli dinamici precedenti a volte sbagliavano la stima e facevano sparire il box.
  ctx = boxNoteARighe(ctx, 31)
  ctx = blocchettoFirmaPagina1(ctx)

  // =====================================================
  // PAGINA 2 — Condizioni generali, tutte su un unico foglio (due colonne, testo più piccolo)
  // =====================================================
  const clausole: { titolo: string; testo: string }[] = [
    {
      titolo: 'Art. 1 — Premesse e definizioni',
      testo: 'Le premesse costituiscono parte integrante del contratto. Per "contratto" si intende il presente Contratto di Vendita comprensivo di queste condizioni generali.',
    },
    {
      titolo: 'Art. 2 — Oggetto del contratto',
      testo: `Il contratto disciplina la compravendita tra ${AZIENDA.ragioneSociale} ("Azienda Venditrice") e l'Acquirente del veicolo usato sopra descritto, ai sensi del Codice del Consumo (D.Lgs. 206/2005) e del Codice Civile.`,
    },
    {
      titolo: 'Art. 3 — Prezzo',
      testo: 'Il prezzo concordato si intende comprensivo di IVA, salvo diversa indicazione. Restano a carico dell\'Acquirente gli oneri non ricompresi (tassa di possesso, assicurazione, trascrizione), salvo diverso accordo.',
    },
    {
      titolo: 'Art. 4 — Caparra penitenziale',
      testo: 'L\'Acquirente versa una Caparra Penitenziale non superiore al 10% del prezzo. In caso di recesso o inadempimento dell\'Azienda Venditrice, questa restituisce il doppio della caparra; in caso di inadempimento dell\'Acquirente, l\'Azienda Venditrice trattiene la caparra a titolo di indennizzo.',
    },
    {
      titolo: 'Art. 5 — Consegna',
      testo: 'La consegna avviene presso la sede dell\'Azienda Venditrice. L\'Acquirente ritira il veicolo entro 7 giorni dal pagamento; oltre tale termine è dovuto un indennizzo di 20€ (oltre IVA) per giorno di ritardo.',
    },
    {
      titolo: 'Art. 6 — Pagamento',
      testo: 'Il saldo va versato entro 7 giorni dalla messa a disposizione del veicolo e comunque prima della consegna, presso la sede dell\'Azienda Venditrice. Il contante rispetta i limiti antiriciclaggio (art. 49, D.Lgs. 231/2007). In caso di finanziamento, il ritiro avviene solo dopo l\'erogazione del saldo da parte dell\'istituto finanziario.',
    },
    {
      titolo: 'Art. 7 — Responsabilità',
      testo: 'Dalla consegna, l\'Acquirente assume ogni responsabilità per danni derivanti dalla circolazione e detenzione del veicolo, tenendo indenne l\'Azienda Venditrice da pretese di terzi.',
    },
    {
      titolo: 'Art. 8 — Garanzie',
      testo: 'Il veicolo è coperto da Garanzia Legale di Conformità di 12 mesi (Codice del Consumo), oltre l\'eventuale garanzia aggiuntiva indicata. Sono esclusi i difetti da normale usura o chilometraggio, se già dichiarati nello stato d\'uso al momento della vendita.',
    },
  ]

  if (a.permuta_marca) {
    clausole.push({
      titolo: 'Art. 9 — Permuta',
      testo: 'L\'Acquirente consegna il veicolo in permuta al ritiro dell\'auto acquistata. L\'Azienda Venditrice ha 30 giorni per verificarlo: vizi non dichiarati sono rimborsati dall\'Acquirente; in caso di vizio grave, l\'Azienda Venditrice può restituire il veicolo e l\'Acquirente verserà il valore di permuta pattuito.',
    })
  }

  clausole.push(
    {
      titolo: `Art. ${clausole.length + 1} — Accordi particolari`,
      testo: 'Deroghe o modifiche alle presenti condizioni sono valide solo se accettate e sottoscritte espressamente da entrambe le parti.',
    },
    {
      titolo: `Art. ${clausole.length + 2} — Foro competente`,
      testo: 'Per ogni controversia relativa al presente contratto è competente il foro del luogo in cui ha sede l\'Azienda Venditrice.',
    },
    {
      titolo: `Art. ${clausole.length + 3} — Diritto di recesso (vendite fuori sede)`,
      testo: 'Se la vendita è conclusa fuori dalla sede dell\'Azienda Venditrice (domicilio, luogo di lavoro, area pubblica o internet), l\'Acquirente può recedere entro 14 giorni con lettera raccomandata.',
    },
    {
      titolo: 'Approvazione specifica delle clausole',
      testo: 'L\'Acquirente dichiara di aver ricevuto l\'informativa precontrattuale e di approvare specificamente, ai sensi degli artt. 1341-1342 c.c., le clausole di Oggetto, Caparra, Prezzo, Consegna, Pagamento, Responsabilità, Garanzie e Foro Competente.',
    }
  )

  ctx = paginaClausoleDueColonne(ctx.doc, 'Condizioni Generali di Vendita', clausole)
  ctx = firmaSingolaConData(ctx)

  // =====================================================
  // PAGINA 3 — Informativa privacy (+ eventuale allegato accessori)
  // =====================================================
  ctx.doc.addPage()
  ctx = { doc: ctx.doc, y: 20 }
  ctx = sezione(ctx, 'Informativa sul Trattamento dei Dati Personali')

  ctx = paragrafo(
    ctx,
    `${AZIENDA.ragioneSociale}, con sede legale in ${AZIENDA.indirizzoLegale}, ${AZIENDA.capCittaLegale}, P.IVA ${AZIENDA.piva}, in qualità di Titolare del trattamento, informa l'Acquirente, ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 (GDPR), che i dati personali raccolti nell'ambito del presente contratto saranno trattati secondo i principi di liceità, correttezza, trasparenza, limitazione delle finalità e minimizzazione previsti dalla normativa vigente.`,
    { titolo: 'Titolare del trattamento', fontSize: 10 }
  )

  ctx = paragrafo(
    ctx,
    "I dati personali (anagrafici, di contatto, fiscali e, ove applicabile, relativi al veicolo in permuta) sono trattati per la conclusione e l'esecuzione del presente contratto di compravendita, per l'adempimento degli obblighi di legge, fiscali e contabili connessi, per l'eventuale gestione di pratiche di finanziamento o leasing su richiesta dell'Acquirente, e per l'erogazione della garanzia legale di conformità e dell'assistenza post-vendita.",
    { titolo: 'Finalità del trattamento', fontSize: 10 }
  )

  ctx = paragrafo(
    ctx,
    "La base giuridica del trattamento è l'esecuzione di un contratto di cui l'interessato è parte (art. 6.1.b GDPR) e l'adempimento di obblighi legali cui è soggetto il Titolare (art. 6.1.c GDPR), in particolare in materia fiscale, di antiriciclaggio e di tutela del consumatore.",
    { titolo: 'Base giuridica', fontSize: 10 }
  )

  ctx = paragrafo(
    ctx,
    "I dati potranno essere comunicati, per le sole finalità sopra indicate, a soggetti terzi quali istituti bancari o finanziari (in caso di richiesta di finanziamento o leasing), compagnie assicurative, professionisti e consulenti dell'Azienda Venditrice, pubbliche amministrazioni competenti (es. PRA, Motorizzazione), nonché a fornitori che operano in qualità di responsabili del trattamento. I dati non vengono diffusi né ceduti a terzi per finalità di marketing senza un separato ed espresso consenso.",
    { titolo: 'Comunicazione e destinatari dei dati', fontSize: 10 }
  )

  ctx = paragrafo(
    ctx,
    "I dati sono conservati per il tempo necessario alle finalità sopra indicate e, successivamente, per il periodo previsto dagli obblighi di legge in materia fiscale e civilistica (di norma 10 anni dalla conclusione del rapporto contrattuale), salvo termini diversi previsti da specifiche disposizioni normative.",
    { titolo: 'Periodo di conservazione', fontSize: 10 }
  )

  ctx = paragrafo(
    ctx,
    `L'Acquirente potrà in ogni momento esercitare i diritti di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione al trattamento previsti dagli artt. 15-22 del GDPR, nonché proporre reclamo al Garante per la Protezione dei Dati Personali, contattando ${AZIENDA.ragioneSociale} ai recapiti indicati in intestazione al presente documento.`,
    { titolo: 'Diritti dell\'interessato', fontSize: 10 }
  )

  ctx = firmaSingolaConData(ctx)

  const prefissoNumero = a.numero_contratto ? `${a.numero_contratto.replace(/[^\w-]/g, '')}-` : ''
  const nomeFileVendita = `contratto-vendita-${prefissoNumero}${nomeAuto(a).replace(/\s+/g, '-')}.pdf`
  scarica(ctx.doc, nomeFileVendita)
  void salvaInArchivio(ctx.doc, nomeFileVendita, a.id, 'contratto_vendita', a.numero_contratto)
}

// =====================================================
// 2. CONTRATTO DI ACQUISTO (da privato/fornitore)
// =====================================================
export function generaContrattoAcquisto(a: AnnuncioDocumenti) {
  // =====================================================
  // PAGINA 1 — Dati venditore, veicolo, dotazioni/esame tecnico affiancati, condizioni economiche
  // =====================================================
  let ctx = creaDocumentoTitoloSopra('CONTRATTO DI ACQUISTO VEICOLO USATO', 'Ai sensi del Codice Civile, art. 1490 e successivi', a.numero_contratto)

  ctx = sezione(ctx, 'Venditore')
  ctx = righeCampi(ctx, [
    ['Nome e Cognome / Ditta', `${a.cliente_nome || ''} ${a.cliente_cognome || ''}`.trim() || '—'],
    ['Codice Fiscale / P.IVA', a.cliente_codice_fiscale || a.cliente_piva || '—'],
    ['Residenza', formattaResidenza(a)],
    ['Cellulare', a.cliente_cellulare || '—'],
    ['Email', a.cliente_email || '—'],
    ['Professione', a.cliente_professione || '—'],
  ])

  ctx = sezione(ctx, 'Dati Identificativi del Veicolo')
  ctx = righeCampi(
    ctx,
    [
      ['Marca', a.marca],
      ['Modello', a.modello],
      ['Versione', a.versione || '—'],
      ['Cc (cilindrata)', a.cilindrata_cc ? `${a.cilindrata_cc} cc` : '—'],
      ['Alimentazione', a.alimentazione],
      ['Colore', a.colore || '—'],
      ['Targa', a.targa || '—'],
      ['Numero Telaio', a.numero_telaio || '—'],
      ['Provenienza / 1° immatricolazione', a.provenienza || '—'],
      ['N° proprietari', String(a.numero_proprietari ?? '—')],
      ['N° mini passaggi', String(a.numero_mini_pass ?? '—')],
      ['Prima immatricolazione', `${a.immatricolazione_mese ?? ''}/${a.immatricolazione_anno ?? '—'}`],
      ['Km da tachimetro', `${a.km} km`],
      ['Ultima manutenzione', `${a.ultima_manutenzione_km ?? '—'} km — ${data(a.ultima_manutenzione_data)}`],
      ['Scadenza revisione', data(a.scadenza_revisione)],
    ],
    3
  )

  const dot = a.dotazioni || {}
  ctx = dualeQuattroColonne(
    ctx,
    {
      titolo: 'Dotazioni e Documenti',
      campi: [
        ['Carnet tagliandi', labelDotazione(dot.carnet_tagliandi)],
        ['Tagliandi regolari', labelDotazione(dot.tagliandi_regolari)],
        ['Ruota di scorta', labelDotazione(dot.ruota_scorta)],
        ['Kit emergenza', labelDotazione(dot.attrezzatura_emergenza)],
        ['Chiavi di scorta', labelDotazione(dot.chiavi_scorta)],
        ['Carta di circolazione', labelDotazione(dot.carta_circolazione)],
        ['IVA (esposta in fattura)', labelDotazione(dot.iva)],
        ['Scadenza bollo', data(a.scadenza_bollo)],
      ],
    },
    {
      titolo: 'Esame Tecnico / Perizia',
      campi: [
        ['Motore', a.esame_tecnico?.motore || '—'],
        ['Distribuzione', a.esame_tecnico?.distribuzione || '—'],
        ['Frizione', a.esame_tecnico?.frizione || '—'],
        ['Cambio', a.esame_tecnico?.cambio || '—'],
        ['Turbina', a.esame_tecnico?.turbina || '—'],
        ['Telaio', a.esame_tecnico?.telaio || '—'],
        ['Parti elettriche', a.esame_tecnico?.parti_elettriche || '—'],
        ['Gruppo guida', a.esame_tecnico?.gruppo_guida || '—'],
        ['Impianto frenante', a.esame_tecnico?.impianto_frenante || '—'],
      ],
    }
  )

  if (a.note_documento) {
    ctx = sezione(ctx, 'Note')
    ctx = paragrafo(ctx, a.note_documento)
  }

  ctx = sezione(ctx, 'Condizioni Economiche')
  ctx = righeCampi(ctx, [
    ['Prezzo pattuito veicolo in acquisto', euro(a.prezzo)],
    ['Passaggio di proprietà (a carico)', '—'],
  ])

  ctx = firme(ctx, ['Firma Venditore', `Timbro e Firma ${AZIENDA.ragioneSociale}`])

  // =====================================================
  // PAGINA 2 — Condizioni generali di acquisto, riquadro firma accettazione
  // =====================================================
  const clausoleAcquisto: { titolo: string; testo: string }[] = [
    {
      titolo: 'Art. 1 — Premesse',
      testo: `Le premesse costituiscono parte integrante del contratto. Il Venditore, quale proprietario o delegato dal proprietario, propone a ${AZIENDA.ragioneSociale} ("Azienda Compratrice") l'accordo economico descritto.`,
    },
    {
      titolo: 'Art. 2 — Oggetto del contratto',
      testo: "Il contratto disciplina la compravendita tra l'Azienda Compratrice e il Venditore di un veicolo usato di proprietà del Venditore o di terzi, ai sensi dell'art. 1490 e seguenti del Codice Civile.",
    },
    {
      titolo: 'Art. 3 — Prezzo',
      testo: 'Il prezzo concordato si intende comprensivo di IVA laddove dovuta.',
    },
    {
      titolo: 'Art. 4 — Consegna',
      testo: "La consegna avviene presso la sede indicata dall'Azienda Compratrice, che può affidare le pratiche di trasferimento di proprietà ad agenzie di propria fiducia.",
    },
    {
      titolo: 'Art. 5 — Pagamento',
      testo: "Il pagamento avviene presso la sede dell'Azienda Compratrice, con rilascio di quietanza. Il contante rispetta i limiti antiriciclaggio (art. 49, D.Lgs. 231/2007).",
    },
    {
      titolo: 'Art. 6 — Responsabilità e dichiarazioni del Venditore',
      testo: 'Il Venditore dichiara, sotto la propria responsabilità: i km sono quelli realmente percorsi; non vi sono vizi occulti; il veicolo non è sottoposto a fermo o sequestro. L\'Azienda Compratrice ha 30 giorni per verificare il veicolo: vizi non denunciati sono rimborsati dal Venditore; in caso di vizio grave può chiedere la risoluzione del contratto.',
    },
    {
      titolo: 'Art. 7 — Accordi particolari',
      testo: 'Deroghe o modifiche sono valide solo se accettate e sottoscritte espressamente da entrambe le parti.',
    },
    {
      titolo: 'Art. 8 — Foro competente',
      testo: "Per ogni controversia è competente il foro del luogo in cui ha sede l'Azienda Compratrice.",
    },
  ]

  ctx = paginaClausoleDueColonne(ctx.doc, 'Condizioni Generali di Acquisto', clausoleAcquisto)
  ctx = firmaConRiquadro(ctx, 'Firma per accettazione delle Condizioni Generali di Acquisto')
  ctx = firme(ctx, ['Firma Venditore', 'Luogo e data'])

  // =====================================================
  // Informativa privacy: segue naturalmente (nuova pagina solo se non c'è spazio,
  // non più forzata a prescindere)
  // =====================================================
  ctx = sezione(ctx, 'Informativa sul Trattamento dei Dati Personali')
  ctx = paragrafo(
    ctx,
    `I dati personali del Venditore vengono trattati da ${AZIENDA.ragioneSociale}, in qualità di Titolare del trattamento, nel rispetto del Regolamento UE 2016/679 (GDPR), con l'ausilio di strumenti anche automatizzati e con l'adozione delle misure tecniche e organizzative idonee a proteggerli da rischi di distruzione, accesso non autorizzato o trattamento non conforme alle finalità della raccolta, esclusivamente per le finalità connesse al presente acquisto e ai relativi obblighi di legge. Il Venditore potrà in ogni momento esercitare i diritti di accesso, rettifica, cancellazione e opposizione previsti dagli artt. 15-22 del GDPR, contattando ${AZIENDA.ragioneSociale} ai recapiti indicati in intestazione.`
  )
  ctx = firme(ctx, ['Firma Venditore', `Firma per ${AZIENDA.ragioneSociale}`])

  const prefissoNumeroAcquisto = a.numero_contratto ? `${a.numero_contratto.replace(/[^\w-]/g, '')}-` : ''
  const nomeFileAcquisto = `contratto-acquisto-${prefissoNumeroAcquisto}${nomeAuto(a).replace(/\s+/g, '-')}.pdf`
  scarica(ctx.doc, nomeFileAcquisto)
  void salvaInArchivio(ctx.doc, nomeFileAcquisto, a.id, 'contratto_acquisto', a.numero_contratto)
}

// =====================================================
// 3. CERTIFICATO DI CONFORMITÀ
// =====================================================
const ORGANI_CONFORMITA: [string, string][] = [
  ['blocco_motore', 'Blocco motore e testata'],
  ['impianto_accensione', 'Impianto di accensione'],
  ['impianto_avviamento', 'Impianto di avviamento'],
  ['impianto_alimentazione', 'Impianto di alimentazione'],
  ['turbocompressore', 'Turbocompressore'],
  ['impianto_aspirazione', 'Impianto di aspirazione'],
  ['impianto_distribuzione', 'Impianto di distribuzione'],
  ['impianto_raffreddamento', 'Impianto di raffreddamento'],
  ['impianto_scarico', 'Impianto di scarico'],
  ['gruppo_frizione_cambio', 'Gruppo frizione / cambio'],
  ['cambio_automatico', 'Cambio automatico'],
  ['gruppo_guida_sterzo_freni', 'Gruppo guida, sterzo e impianto frenante'],
  ['impianto_aria_abitacolo', 'Impianto aria abitacolo'],
  ['impianto_elettrico_elettronico', 'Impianto elettrico/elettronico'],
  ['impianto_sospensioni', 'Impianto sospensioni'],
  ['carrozzeria_interni', 'Carrozzeria e interni'],
  ['tergicristalli', 'Motorini tergicristalli e lavafari'],
  ['gps', 'Impianto di navigazione satellitare (GPS)'],
  ['vetri_elettrici', 'Vetri elettrici'],
  ['antifurto', 'Impianto antifurto'],
  ['chiusura_centralizzata', 'Chiusura centralizzata'],
  ['fari_xenon', 'Fari allo xenon'],
  ['impianto_stereo', 'Impianto stereo'],
  ['impianto_dvd', 'Impianto DVD'],
  ['impianto_bluetooth', 'Impianto Bluetooth'],
]

export function generaCertificatoConformita(a: AnnuncioDocumenti) {
  let ctx = creaDocumentoTitoloSopra('CERTIFICATO DI CONFORMITÀ', "Ai sensi dell'art. 129 e ss. del Codice del Consumo", a.numero_contratto)

  ctx = sezione(ctx, 'Dati Acquirente')
  ctx = righeCampi(ctx, [
    ['Nome e Cognome', `${a.cliente_nome || ''} ${a.cliente_cognome || ''}`.trim() || '—'],
    ['Cellulare/Telefono', a.cliente_cellulare || a.cliente_telefono || '—'],
    ['Email', a.cliente_email || '—'],
    ['Codice Fiscale', a.cliente_codice_fiscale || '—'],
    ['Città di residenza', a.cliente_citta || '—'],
  ])

  ctx = sezione(ctx, 'Dati Veicolo')
  ctx = righeCampi(ctx, [
    ['Marca', a.marca],
    ['Modello', a.modello],
    ['Versione', a.versione || '—'],
    ['Targa', a.targa || '—'],
    ['N° Telaio', a.numero_telaio || '—'],
    ['Data 1° immatricolazione', `${a.immatricolazione_mese ?? ''}/${a.immatricolazione_anno ?? '—'}`],
    ['Normativa anti-inquinamento', a.classe_emissioni || '—'],
    ['Provenienza', a.provenienza || '—'],
    ['N° Proprietari', String(a.numero_proprietari ?? '—')],
    ['N° Mini Passaggi', String(a.numero_mini_pass ?? '—')],
    ['Km da tachimetro alla consegna', `${a.km_alla_consegna ?? a.km} km`],
    ['Prova su strada Acquirente', a.prova_strada_acquirente ? 'Sì' : 'No'],
  ])

  const dotConsegna = a.dotazioni || {}
  ctx = sezione(ctx, 'Documenti alla Consegna')
  ctx = tabellaChecklist(ctx, [
    ['Libretto di circolazione', labelDotazione(dotConsegna.libretto_circolazione)],
    ['Certificato di Proprietà (CdP)', labelDotazione(dotConsegna.cdp)],
    ['Libretto tagliandi', labelDotazione(dotConsegna.carnet_tagliandi)],
    ['N° chiavi consegnate', String(dotConsegna.numero_chiavi_consegnate ?? '—')],
    ['Ultima revisione', data(a.ultima_manutenzione_data)],
    ['Prossima revisione', data(a.scadenza_revisione)],
  ])

  ctx = paragrafo(
    ctx,
    "Le parti e gli organi valutati nello stato d'uso del veicolo sono classificati secondo tre livelli: A) conformi a quanto descritto, nessun intervento necessario; B) conformi rispetto alla vetustà e al chilometraggio del veicolo, come già considerato nel prezzo; C) non conformi, con difetti che compromettono il corretto funzionamento, da ripristinare o sostituire a cura e spese del Venditore prima della consegna, salvo diverso accordo tra le parti.",
    { titolo: 'Classificazione dello stato d\'uso (A / B / C)' }
  )

  ctx = firmeTripleConRiquadro(ctx, ['Letto e accettato (A)', 'Letto e accettato (B)', 'Letto e accettato (C)'])

  // Carrozzeria e interni prima della valutazione organi, come richiesto
  ctx = sezione(ctx, 'Descrizione Carrozzeria e Interni')
  ctx = schemaVeicolo(ctx)

  const cc = a.certificato_conformita || {}
  ctx = sezione(ctx, "Valutazione Organi e Componenti")
  ctx = tabellaChecklistDueColonne(
    ctx,
    ORGANI_CONFORMITA.map(([chiave, label]) => [label, cc[chiave] || '—'])
  )

  ctx = paragrafo(
    ctx,
    `Le parti e gli organi del veicolo non espressamente menzionati nella presente dichiarazione si intendono conformi alla descrizione fatta da ${AZIENDA.ragioneSociale}, tenendo conto del pregresso utilizzo del bene, poiché, ai sensi dell'art. 129 comma 3 del Codice del Consumo, l'Acquirente è in grado di verificarne lo stato d'uso e l'efficienza di funzionamento usando l'ordinaria diligenza.`,
  )

  if (a.note_documento) {
    ctx = sezione(ctx, 'Altre Dichiarazioni dell\'Azienda Venditrice')
    ctx = paragrafo(ctx, a.note_documento)
  }

  ctx = paragrafo(
    ctx,
    `L'Acquirente dichiara di aver letto e valutato attentamente il presente Certificato di Conformità e di aver ricevuto il libretto della Garanzia Legale di Conformità al momento della conclusione del contratto di vendita, di essere a conoscenza di ogni singola parte della valutazione effettuata da ${AZIENDA.ragioneSociale} e di accettare lo stato del veicolo e le condizioni economiche contrattuali, tenendo conto del pregresso utilizzo del bene. La responsabilità per difetto di conformità, come previsto dall'art. 133 comma 4 del Codice del Consumo, ha durata di 12 (dodici) mesi dalla data di ritiro del veicolo.`,
    { titolo: 'Dichiarazione di accettazione' }
  )

  ctx = paragrafo(ctx, 'Data _____________________________')
  ctx = firmeDoppieConRiquadro(ctx, "Firma dell'Acquirente", 'Timbro e Firma')

  const prefissoNumeroCert = a.numero_contratto ? `${a.numero_contratto.replace(/[^\w-]/g, '')}-` : ''
  const nomeFileCert = `certificato-conformita-${prefissoNumeroCert}${nomeAuto(a).replace(/\s+/g, '-')}.pdf`
  scarica(ctx.doc, nomeFileCert)
  void salvaInArchivio(ctx.doc, nomeFileCert, a.id, 'certificato_conformita', a.numero_contratto)
}

// =====================================================
// 4. SCHEDA DI STATO D'USO DEL VEICOLO IN PERMUTA
// =====================================================
export function generaSchedaPermuta(a: AnnuncioDocumenti) {
  let ctx = creaDocumentoTitoloSopra("SCHEDA DI STATO D'USO DEL VEICOLO USATO IN PERMUTA", undefined, a.numero_contratto)

  ctx = sezione(ctx, 'Dati Proprietario (cedente)')
  ctx = righeCampi(ctx, [
    ['Cognome, Nome / Ragione Sociale', `${a.cliente_nome || ''} ${a.cliente_cognome || ''}`.trim() || '—'],
  ], 1)

  ctx = sezione(ctx, 'Dati Identificativi del Veicolo in Permuta')
  ctx = righeCampi(
    ctx,
    [
      ['Marca', a.permuta_marca || '—'],
      ['Modello', a.permuta_modello || '—'],
      ['Versione', a.permuta_versione || '—'],
      ['Cc (cilindrata)', a.permuta_cc ? `${a.permuta_cc} cc` : '—'],
      ['Alimentazione', a.permuta_alimentazione || '—'],
      ['Colore', a.permuta_colore || '—'],
      ['Targa', a.permuta_targa || '—'],
      ['Numero telaio', a.permuta_numero_telaio || '—'],
      ['Scadenza revisione', data(a.permuta_scadenza_revisione)],
      ['N° proprietari', String(a.permuta_numero_proprietari ?? '—')],
      ['Prima immatricolazione', `${a.permuta_immatricolazione_mese ?? ''}/${a.permuta_anno ?? '—'}`],
      ['Ultima manutenzione', `${a.permuta_ultima_manutenzione_km ?? '—'} km — ${data(a.permuta_ultima_manutenzione_data)}`],
      ['Km da tachimetro', a.permuta_km ? `${a.permuta_km} km` : '—'],
      ['Valore riconosciuto in permuta', euro(a.permuta_valore)],
      ['Passaggio di proprietà (costo)', euro(a.permuta_passaggio_proprieta_costo)],
    ],
    3,
    7.8
  )

  // Dotazioni e documenti: come da modulo standard, caselle da spuntare in sede
  // (a differenza dell'Esame Tecnico del Contratto d'Acquisto, qui non è un dato
  // già noto a sistema, va controllato fisicamente sul veicolo in permuta).
  ctx = sezione(ctx, 'Dotazioni e Documenti')
  ctx = caselleCheck(
    ctx,
    [
      'Carnet tagliandi',
      'Tagliandi regolari',
      'Ruota di scorta',
      'Kit attrezzatura di emergenza',
      'Chiavi di scorta',
      'Carta di circolazione',
    ],
    3
  )
  ctx = righeScadenzaBolloEIva(ctx, data(a.permuta_scadenza_bollo), a.permuta_iva_tipo)

  // "Esame Visivo" (titolo+righe+icone) deve restare un blocco unico sulla stessa
  // pagina: senza questa riserva anticipata le icone da sole potrebbero non stare
  // nello spazio residuo e saltare da sole a pagina nuova, staccate dalle loro righe.
  ctx = assicuraSpazio(ctx, 16 + 40 + 45)
  ctx = sezione(ctx, 'Esame Visivo')
  ctx = righeDaCompilare(ctx, ['Carrozzeria', 'Cristalli', 'Abitacolo e tappezzeria', 'Pneumatici'])
  ctx = schemaVeicolo(ctx)

  ctx = sezione(ctx, 'Esame Tecnico / Perizia')
  ctx = checklistSiNo(ctx, [
    { label: 'Motore', condizione: 'Regolare' },
    { label: 'Carrozzeria', condizione: 'Sinistrata' },
    { label: 'Distribuzione', condizione: 'Sostituita' },
    { label: 'Frizione', condizione: 'Regolare' },
    { label: 'Impianto aria abitacolo', condizione: 'Regolare' },
    { label: 'Impianto elettrico', condizione: 'Regolare' },
    { label: 'Impianto di scarico', condizione: 'Regolare' },
  ])
  ctx = righeDaCompilare(ctx, ['Note generali'], 30)

  ctx = paragrafo(
    ctx,
    `In caso di permuta, ${AZIENDA.ragioneSociale} si riserva un periodo di 30 giorni dalla data del ritiro del veicolo per esaminarlo con attenzione: qualora presenti vizi o guasti non denunciati, il Cedente rimborserà a ${AZIENDA.ragioneSociale} il costo necessario alla relativa riparazione. Qualora il veicolo rientrato in permuta presentasse vizi o guasti di grave entità (tali da rendere la riparazione impossibile o antieconomica rispetto al valore del veicolo), ${AZIENDA.ragioneSociale} restituirà il veicolo al Cedente, il quale rimetterà a favore di ${AZIENDA.ragioneSociale} il valore del veicolo in permuta, così come pattuito nel contratto di vendita.`,
    { titolo: 'Nota' }
  )

  ctx = righeDaCompilare(ctx, ['Data e ora ritiro del veicolo in permuta'], 75)

  ctx = paragrafo(
    ctx,
    "Il sottoscritto dichiara di aver preso visione dell'informativa D.Lgs. 196/2003 riportata nella \"Guida alla Garanzia Legale di Conformità\" ed esprime libero consenso al trattamento dei propri dati personali, ai sensi del Regolamento UE 2016/679 (GDPR).",
    { titolo: 'Informativa sul trattamento dei dati personali' }
  )

  ctx = firme(ctx, ['Firma Dichiarante/Cedente'])

  const prefissoNumeroPermuta = a.numero_contratto ? `${a.numero_contratto.replace(/[^\w-]/g, '')}-` : ''
  const nomeFilePermuta = `scheda-permuta-${prefissoNumeroPermuta}${nomeAuto(a).replace(/\s+/g, '-')}.pdf`
  scarica(ctx.doc, nomeFilePermuta)
  void salvaInArchivio(ctx.doc, nomeFilePermuta, a.id, 'scheda_permuta', a.numero_contratto)
}