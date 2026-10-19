import { Review, ServiceItem, FAQItem } from './types';
import { CITTA, NOME, RAGIONE } from './lib/brand';

export const trustPoints = [
  {
    title: 'Garanzia Europea 12 Mesi',
    description: 'Trasparenza totale e copertura certificata su tutti i guasti, estendibile fino a 36 mesi.'
  },
  {
    title: 'Finanziamenti 30-80 Rate',
    description: 'Piani finanziari flessibili e su misura, con tassi agevolati e opzione anticipo zero.'
  },
  {
    title: 'Permuta & Rottamazione',
    description: 'Valutazione reale, rapida e onesta del tuo usato dopo una perizia attenta in sede.'
  },
  {
    title: 'Consegna in tutta Italia',
    description: 'Portiamo la tua nuova auto direttamente a casa tua, igienizzata e pronta all\'uso.'
  }
];

export const services: ServiceItem[] = [
  {
    id: 'srv-1',
    iconName: 'Car',
    title: 'Vendita Auto Nuove & Usate',
    description: 'Un parco auto accuratamente selezionato e controllato in ogni dettaglio. Offriamo auto usate con chilometraggio certificato e vetture nuove di tutte le principali marche.'
  },
  {
    id: 'srv-2',
    iconName: 'Key',
    title: 'Noleggio a Lungo & Breve Termine',
    description: 'Soluzioni di noleggio flessibili per privati, professionisti e aziende. Canone mensile tutto incluso con manutenzione, assicurazione e soccorso stradale compresi.'
  },
  {
    id: 'srv-3',
    iconName: 'Calculator',
    title: 'Finanziamenti Personalizzati',
    description: 'Formule finanziarie innovative e tassi d\'interesse competitivi. Personalizziamo la rata in base al tuo budget, con possibilità di inserire furto/incendio e servizi accessori.'
  },
  {
    id: 'srv-4',
    iconName: 'ShieldCheck',
    title: 'Coperture Assicurative Complete',
    description: 'Proteggi la tua auto fin dal primo chilometro. Soluzioni integrate contro furto, incendio, eventi naturali, kasko e infortuni conducente a tariffe convenzionate.'
  },
  {
    id: 'srv-5',
    iconName: 'Wrench',
    title: 'Assistenza & Officina Specialistica',
    description: 'Un servizio carrozzeria e officina partner di altissimo livello. Diagnosi computerizzata, manutenzione programmata, tagliandi e riparazioni rapide con ricambi originali.'
  },
  {
    id: 'srv-6',
    iconName: 'RefreshCw',
    title: 'Valutazione Permuta & Rottamazione',
    description: 'Ritiriamo il tuo vecchio usato offrendo la massima quotazione di mercato. Semplifichiamo le pratiche di passaggio di proprietà o di rottamazione della vecchia vettura.'
  }
];

export const reviews: Review[] = [
  {
    id: 'rev-1',
    author: 'Marco Tassinari',
    rating: 5,
    text: 'Senza dubbio la migliore concessionaria in provincia. Personale di una professionalità e disponibilità d\'altri tempi. Non c\'è stata alcuna pressione nella scelta e la trasparenza è stata massima in ogni fase, dal preventivo alla consegna.',
    date: '1 mese fa',
    initials: 'MT',
    verified: true
  },
  {
    id: 'rev-2',
    author: 'Elena Radu',
    rating: 5,
    text: 'Showroom elegantissimo e molto curato nei dettagli. Ho acquistato la mia seconda auto qui (prima una Panda e ora una Jeep Compass) e non posso che confermare l\'estrema serietà e affidabilità del team. Consigliatissimo!',
    date: '2 settimane fa',
    initials: 'ER',
    verified: true
  },
  {
    id: 'rev-3',
    author: 'Giuseppe Bordon',
    rating: 5,
    text: 'Esperienza d\'acquisto fluida, rapida e piacevole. Il consulente di vendita mi ha seguito passo passo nella scelta del finanziamento trovando una soluzione perfetta per le mie esigenze. Auto ritirata ieri, impeccabile in ogni dettaglio.',
    date: '3 mesi fa',
    initials: 'GB',
    verified: true
  },
  {
    id: 'rev-4',
    author: 'Federica Zampieri',
    rating: 5,
    text: `Servizio di permuta fantastico! Valutazione corretta del mio usato senza giochetti o false offerte. La trasparenza e la serietà di ${NOME} sono una garanzia. Grazie mille per la pazienza e l'accoglienza.`,
    date: '10 giorni fa',
    initials: 'FZ',
    verified: true
  }
];

export const processSteps = [
  {
    number: '01',
    title: 'Scegli la tua auto',
    description: `Esplora il nostro parco auto online o vieni a trovarci a ${CITTA} per scoprire le ultime novità multimarca.`
  },
  {
    number: '02',
    title: 'Provala in sede',
    description: 'Prenota un test drive gratuito senza alcun impegno. Senti come risponde l\'auto su strada insieme a un nostro consulente.'
  },
  {
    number: '03',
    title: 'Finanziamento su misura',
    description: 'Studiamo insieme la formula di pagamento ottimale: tassi agevolati, piani da 30 a 80 rate e zero sorprese.'
  },
  {
    number: '04',
    title: 'Ritira la tua auto',
    description: 'Consegna chiavi in mano con controlli certificati pre-consegna e garanzia ufficiale europea di 12 mesi.'
  }
];

export const faqData: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Acquisto',
    question: 'Quali documenti servono per l\'acquisto di un\'auto?',
    answer: `Per l'acquisto di un veicolo presso ${NOME} ${CITTA} sono necessari: un documento d'identità in corso di validità, il codice fiscale, l'ultimo cedolino dello stipendio (se si richiede un finanziamento) e i dati relativi alla propria banca per l'addebito.`
  },
  {
    id: 'faq-2',
    category: 'Garanzia',
    question: 'Che tipo di garanzia offrite sulle auto usate?',
    answer: 'Tutte le nostre auto usate comprendono una Garanzia Europea di Conformità di 12 mesi. Questa garanzia copre le principali componenti meccaniche, elettriche ed elettroniche del veicolo e comprende l\'assistenza stradale h24. Inoltre, è possibile estendere la garanzia fino a 24 o 36 mesi.'
  },
  {
    id: 'faq-3',
    category: 'Finanziamenti',
    question: 'Come funzionano i vostri finanziamenti da 30 a 80 rate?',
    answer: 'Offriamo finanziamenti personalizzati flessibili con durata da 30 a 80 mesi, con o senza anticipo. Collaboriamo con i principali istituti di credito automotive per garantire tassi competitivi (TAN/TAEG chiari). È anche possibile integrare nella rata polizze assicurative come Furto, Incendio, Cristalli ed Eventi Naturali.'
  },
  {
    id: 'faq-4',
    category: 'Permuta',
    question: 'Valutate o acquistate il mio usato anche se non compro un\'altra auto?',
    answer: `Sì! Presso ${RAGIONE} a ${CITTA} effettuiamo perizie attente del tuo usato. Valutiamo permute sia per l'acquisto del nuovo/usato sia per l'acquisto diretto da parte nostra, offrendo quotazioni competitive basate sul mercato reale e pagamenti sicuri immediati.`
  },
  {
    id: 'faq-5',
    category: 'Noleggio',
    question: 'Quali sono i vantaggi del noleggio a lungo termine per privati?',
    answer: 'Il noleggio a lungo termine permette di guidare un\'auto sempre nuova senza preoccuparsi della svalutazione, della manutenzione ordinaria e straordinaria, del bollo e dell\'assicurazione (RC, Kasko, Furto/Incendio). Tutto è incluso in un unico canone mensile fisso e trasparente.'
  },
  {
    id: 'faq-6',
    category: 'Acquisto',
    question: 'Posso fare un test drive prima di decidere?',
    answer: 'Assolutamente sì! Crediamo che provare la vettura su strada sia fondamentale. Puoi prenotare un test drive gratuito e senza impegno su qualsiasi auto del nostro parco contattandoci telefonicamente o compilando il modulo sul sito. Saremo lieti di accompagnarti.'
  }
];

