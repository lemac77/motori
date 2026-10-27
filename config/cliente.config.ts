import type { ClienteConfig } from './tipi'

/**
 * CONFIGURAZIONE CLIENTE
 * ----------------------
 * Questo è l'unico file da compilare per un nuovo salone (più i file in /brand).
 * Valori attuali: salone DEMO "Demo GestAuto", tutti i dati sono di fantasia.
 */
export const cliente: ClienteConfig = {
  demo: true,
  demoInfo: {
    urlSito: 'https://sito.gestauto.me',
    urlGestionale: 'https://app.gestauto.me',
    // URL della landing GestAuto: dal login il link "Richiedile qui" porta al form demo
    urlLanding: 'https://gestauto.me',
    // Le credenziali dell'utente demo NON vanno messe qui: questo file finisce nel
    // JavaScript pubblico. Vivono solo in Supabase e nelle variabili della landing.
  },

  azienda: {
    nome: 'Demo GestAuto',
    ragioneSociale: 'Demo GestAuto Srl',
    piva: '00000000000',
    registroImprese: 'XX',
    rea: 'XX-000000',
    capitaleSociale: '€ 10.000 i.v.',
    sedeLegale: {
      via: 'Via della Demo 1',
      cap: '00000',
      citta: 'Città Demo',
      provincia: 'XX',
    },
    claim: 'Vendita auto multimarca nuove e usate',
    annoFondazione: 2012,
  },

  showroom: {
    via: 'Via della Demo 1',
    cap: '00000',
    citta: 'Città Demo',
    provincia: 'XX',
    regione: 'Italia',
    geoRegion: 'IT',
    lat: 45.5455,
    lng: 11.5354,
    queryMappa: 'Italia',
    areaServita: 'tutta Italia',
  },

  // Demo: solo email segnaposto (telefono/WhatsApp vuoti, quei bottoni restano nascosti)
  contatti: {
    email: 'info@bericamotori.it',
  },

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
    url: 'https://sito.gestauto.me',
    lingua: 'it',
    locale: 'it_IT',
    titoloHome: 'Demo GestAuto | Auto Usate Garantite, Nuove e Noleggio',
    descrizioneHome:
      "Auto usate certificate, nuove e a noleggio. Sito dimostrativo di GestAuto. Garanzia 12 mesi inclusa, finanziamenti da 30 a 80 rate e valutazione permuta. Vieni a trovarci in showroom.",
    keywords: [
      'Demo GestAuto',
      'concessionaria',
      'auto usate',
      'auto nuove',
      'noleggio auto',
      'finanziamento auto',
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
    titolo: 'Demo GestAuto · Gestionale',
    placeholderEmail: 'nome@bericamotori.it',
  },
}

export default cliente
