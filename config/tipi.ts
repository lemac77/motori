/**
 * Struttura del file di configurazione cliente.
 * Ogni salone ha il suo `cliente.config.ts` con questi campi: è l'UNICO posto
 * dove vivono nome, dati legali, contatti, colori, SEO e chiavi di tracking.
 * Sito e gestionale lo leggono entrambi (alias Vite `@cliente`).
 */

export type GiornoSchema =
  | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface Indirizzo {
  via: string            // "Viale dei Colli 21"
  cap: string            // "36100"
  citta: string          // "Vicenza"
  provincia: string      // sigla, "VI"
}

export interface FasciaOraria {
  /** Etichetta estesa, es. "Lunedì - Venerdì" (pagina Contatti) */
  etichetta: string
  /** Etichetta corta, es. "Lun - Ven" (footer, box laterali) */
  etichettaBreve: string
  /** Giorni in formato schema.org per il JSON-LD */
  giorni: GiornoSchema[]
  /** Fasce di apertura [apre, chiude]. Vuoto = chiuso. */
  fasce: [string, string][]
  /** Nota opzionale, es. "Pomeriggio su appuntamento" */
  nota?: string
}

export interface ClienteConfig {
  /** Modalità demo: barra "sito dimostrativo", noindex, form finti, niente tracking */
  demo: boolean
  /** Solo in demo: link incrociati tra sito, gestionale e landing (mai credenziali: finiscono nel JS pubblico) */
  demoInfo?: {
    urlSito?: string
    urlGestionale?: string
    urlLanding?: string
  }

  azienda: {
    /** Nome commerciale che compare su sito, header, mail: "Autosalone Test" */
    nome: string
    /** Ragione sociale completa per contratti e footer legale: "Autosalone Test Srl" */
    ragioneSociale: string
    piva: string
    codiceFiscale?: string
    registroImprese: string  // sigla provincia CCIAA, es. "VI"
    rea: string              // es. "VI-000000"
    capitaleSociale: string  // es. "€ 10.000 i.v."
    pec?: string
    sedeLegale: Indirizzo
    /** Claim sotto il logo nei PDF e nel footer: "Vendita auto multimarca nuove e usate" */
    claim: string
    /** Anno di fondazione, usato nei testi "chi siamo" (opzionale) */
    annoFondazione?: number
  }

  showroom: Indirizzo & {
    regione: string          // "Veneto"
    /** Codice ISO regione/provincia per geo.region, es. "IT-VI" */
    geoRegion: string
    lat: number
    lng: number
    /** Testo usato per link/embed Google Maps */
    queryMappa: string
    /** Zona di riferimento nei testi SEO, es. "Vicenza e provincia" */
    areaServita: string
  }

  /**
   * Tutti i contatti sono opzionali: se un campo è vuoto, sito e PDF
   * nascondono da soli i relativi bottoni/righe (es. demo senza contatti).
   */
  contatti: {
    /** Fisso, formato leggibile: "0444 000000" */
    telefono?: string
    /** Cellulare/WhatsApp leggibile: "333 000 0000" */
    cellulare?: string
    /** Numero WhatsApp internazionale solo cifre, es. "393330000000" */
    whatsapp?: string
    email?: string
    /** Email per richieste privacy (se diversa) */
    emailPrivacy?: string
  }

  orari: FasciaOraria[]

  social: {
    instagram?: string
    facebook?: string
    tiktok?: string
    youtube?: string
  }

  brand: {
    colori: {
      primario: string       // accento principale (bottoni, link, evidenze)
      primarioHover: string
    }
    /**
     * Percorsi relativi alla cartella `brand/` alla radice del monorepo.
     * Il plugin Vite li copia in /brand/* di entrambe le app.
     */
    logo: {
      /** Logo per sfondi scuri (sito, gestionale tema scuro) */
      chiaro: string
      /** Logo per sfondi chiari (gestionale tema chiaro, PDF) */
      scuro: string
      /** PNG ad alta risoluzione per i PDF dei contratti (proporzioni lette in automatico) */
      pdf: string
    }
  }

  sito: {
    /** URL pubblico senza slash finale: "https://www.bericamotori.it" */
    url: string
    lingua: string           // "it"
    locale: string           // "it_IT"
    titoloHome: string
    descrizioneHome: string
    keywords: string[]
    /** Percorso in public/ dell'immagine Open Graph */
    ogImage: string
    ogImageWidth: number
    ogImageHeight: number
    /** Fascia prezzo schema.org */
    priceRange: string
  }

  /** Promesse commerciali citate nei testi: cambiano da salone a salone */
  offerta: {
    garanziaMesi: number
    garanziaEstendibileMesi: number[]  // es. [24, 36]
    rateMin: number
    rateMax: number
    noleggio: boolean
    consegnaItalia: boolean
  }

  integrazioni: {
    ga4Id?: string           // "G-XXXXXXXXXX"
    gtmId?: string           // "GTM-XXXXXXX"
    featurableId?: string    // ID widget recensioni Featurable
    trustindexId?: string    // ID widget Trustindex (alternativa a Featurable)
  }

  gestionale: {
    /** Titolo della tab del pannello */
    titolo: string
    /** Placeholder campo email al login */
    placeholderEmail: string
  }
}
