import type { ClienteConfig } from './tipi'

/**
 * CONFIGURAZIONE CLIENTE
 * ----------------------
 * Questo è l'unico file da compilare per un nuovo salone (più i file in /brand).
 * Valori attuali: salone DEMO "Berica Motori", tutti i dati sono di fantasia.
 */
export const cliente: ClienteConfig = {
  demo: true,
  demoInfo: {
    // Da compilare quando i due progetti Vercel sono online
    urlSito: '',
    urlGestionale: '',
    urlLanding: '',
    // Utente da creare in Supabase > Authentication > Users
    loginEmail: 'demo@bericamotori.it',
    loginPassword: 'BericaDemo2026',
  },

  azienda: {
    nome: 'Berica Motori',
    ragioneSociale: 'Berica Motori Srl',
    piva: '00000000000',
    registroImprese: 'VI',
    rea: 'VI-000000',
    capitaleSociale: '€ 10.000 i.v.',
    sedeLegale: {
      via: 'Via dei Motori 12',
      cap: '36100',
      citta: 'Vicenza',
      provincia: 'VI',
    },
    claim: 'Vendita auto multimarca nuove e usate',
    annoFondazione: 2012,
  },

  showroom: {
    via: 'Via dei Motori 12',
    cap: '36100',
    citta: 'Vicenza',
    provincia: 'VI',
    regione: 'Veneto',
    geoRegion: 'IT-VI',
    lat: 45.5455,
    lng: 11.5354,
    queryMappa: 'Vicenza, VI',
    areaServita: 'Vicenza e provincia',
  },

  // Demo collegata a una landing: nessun contatto, i blocchi relativi spariscono da soli
  contatti: {},

  orari: [
    {
      etichetta: 'Lunedì - Venerdì',
      etichettaBreve: 'Lun - Ven',
      giorni: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      fasce: [['09:00', '12:30'], ['15:00', '19:00']],
    },
    {
      etichetta: 'Sabato',
      etichettaBreve: 'Sabato',
      giorni: ['Saturday'],
      fasce: [['09:00', '12:30']],
      nota: 'Pomeriggio su appuntamento',
    },
    {
      etichetta: 'Domenica',
      etichettaBreve: 'Domenica',
      giorni: ['Sunday'],
      fasce: [],
    },
  ],

  social: {
    instagram: '',
    facebook: '',
  },

  brand: {
    colori: {
      primario: '#e8612c',
      primarioHover: '#c94e1d',
    },
    logo: {
      chiaro: 'logo-chiaro.svg',
      scuro: 'logo-scuro.svg',
      pdf: 'logo-pdf.png',
    },
  },

  sito: {
    url: 'https://www.bericamotori.it',
    lingua: 'it',
    locale: 'it_IT',
    titoloHome: 'Berica Motori Vicenza | Auto Usate Garantite, Nuove e Noleggio',
    descrizioneHome:
      "Auto usate certificate, nuove e a noleggio a Vicenza. Garanzia 12 mesi inclusa, finanziamenti da 30 a 80 rate e valutazione permuta. Vieni a trovarci in showroom.",
    keywords: [
      'Berica Motori',
      'concessionaria Vicenza',
      'auto usate Vicenza',
      'auto nuove Vicenza',
      'noleggio auto Vicenza',
      'finanziamento auto Vicenza',
    ],
    ogImage: '/og-image.jpg',
    ogImageWidth: 1600,
    ogImageHeight: 838,
    priceRange: '$$',
  },

  offerta: {
    garanziaMesi: 12,
    garanziaEstendibileMesi: [24, 36],
    rateMin: 30,
    rateMax: 80,
    noleggio: true,
    consegnaItalia: true,
  },

  integrazioni: {
    // In demo restano vuote: niente GA4/GTM, recensioni di esempio al posto del widget
    ga4Id: '',
    gtmId: '',
    featurableId: '',
    trustindexId: '',
  },

  gestionale: {
    titolo: 'Berica Motori · Gestionale',
    placeholderEmail: 'nome@bericamotori.it',
  },
}

export default cliente
