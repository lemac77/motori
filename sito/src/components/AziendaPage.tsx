import { motion } from 'motion/react';
import { 
  ShieldCheck, Sparkles, MapPin, Award, Users, Heart, ArrowRight, 
  Wrench, FileText, CheckCircle2, ShieldAlert, Cpu, Calendar, CreditCard
} from 'lucide-react';
import showroomEsterno from '../assets/images/showroom/showroom-esterno-tramonto.webp';
import showroomInterno from '../assets/images/showroom/showroom-interno-vista-alto.webp';
import ShowroomGallery from './ShowroomGallery';
import { CITTA, INDIRIZZO, NOME, RAGIONE, REGIONE } from '../lib/brand';

interface AziendaPageProps {
  onNavigateToContacts: () => void;
}

export default function AziendaPage({ onNavigateToContacts }: AziendaPageProps) {
  const values = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-brand" />,
      title: 'Trasparenza Totale',
      description: 'Chilometri certificati per iscritto, perizie chiare ed eque di ogni vettura sul contratto.'
    },
    {
      icon: <Award className="h-6 w-6 text-brand" />,
      title: 'Eccellenza Selezionata',
      description: 'Scegliamo solo veicoli con uno storico di manutenzione certo e in condizioni eccellenti.'
    },
    {
      icon: <Sparkles className="h-6 w-6 text-brand" />,
      title: 'Servizio su Misura',
      description: 'Dall\'accoglienza alla consegna, studiamo soluzioni su misura adatte alle tue esigenze finanziarie.'
    },
    {
      icon: <Heart className="h-6 w-6 text-brand" />,
      title: 'Passione per il Territorio',
      description: `Siamo orgogliosi di essere un punto di riferimento solido a ${CITTA} e in tutto il ${REGIONE}.`
    }
  ];

  // Detailed 110 quality check protocol
  const protocolSteps = [
    {
      icon: <Cpu className="h-5 w-5 text-brand" />,
      title: 'Diagnostica Computerizzata',
      description: 'Analizziamo tutte le centraline elettroniche per verificare l\'assenza di anomalie latenti o alterazioni digitali.'
    },
    {
      icon: <Wrench className="h-5 w-5 text-brand" />,
      title: 'Ispezione Meccanica e Organi di Moto',
      description: 'Freni, sospensioni, frizione, giunti, e sistemi di trasmissione vengono smontati e verificati accuratamente.'
    },
    {
      icon: <FileText className="h-5 w-5 text-brand" />,
      title: 'Certificazione Chilometrica e Storico',
      description: 'Incrociamo i dati del portale dell\'automobilista, lo storico tagliandi originale e database assicurativi per garantire chilometri reali.'
    },
    {
      icon: <Sparkles className="h-5 w-5 text-brand" />,
      title: 'Sanificazione Completa ad Ozono',
      description: 'Un trattamento igienizzante certificato che elimina batteri, allergeni e cattivi odori da tutta la tappezzeria e dai condotti clima.'
    }
  ];

  return (
    <div className="pt-24 pb-16 bg-black text-white min-h-screen">
      {/* Hero Header */}
      <div className="relative border-b border-neutral-900 bg-neutral-950/40 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase font-bold tracking-wider text-brand"
          >
            ECCELLENZA CERTIFICATA • {NOME.toUpperCase()} {CITTA.toUpperCase()}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-white"
          >
            LA NOSTRA FILOSOFIA
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-normal"
          >
            {RAGIONE} non è semplicemente un salone d'auto. È un centro di consulenza automobilistica premium a {CITTA} fondato sulla trasparenza radicale, la fiducia reciproca e la qualità senza compromessi.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-16 space-y-24">
        
        {/* Story Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <span className="text-xs uppercase font-bold tracking-wider text-brand">LA REALTÀ LOCALE</span>
            <h2 className="font-display text-3xl font-black text-white uppercase tracking-tight leading-tight">
              {RAGIONE.toUpperCase()}: <br />IL PUNTO DI RIFERIMENTO A {CITTA.toUpperCase()}
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-neutral-405 leading-relaxed font-normal text-neutral-400">
              <p>
                Nata nel cuore del {REGIONE}, la nostra concessionaria in <strong>{INDIRIZZO}, {CITTA}</strong> ha ridefinito il mercato dell'usato locale. Abbiamo scelto di concentrarci solo su veicoli selezionati di cui possiamo garantire al 100% l'origine e lo stato d'usura.
              </p>
              <p>
                In un mercato spesso saturo di incertezze, {RAGIONE} si distingue offrendo certezze scritte. Ogni trattativa è guidata da consulenti dedicati che analizzano le tue abitudini di guida per consigliarti l'alimentazione e la formula finanziaria migliore, escludendo spese impreviste o tassi d'interesse occulti.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 relative"
          >
            <div className="rounded-2xl overflow-hidden border border-neutral-900 aspect-[4/3] shadow-2xl relative group bg-neutral-950">
              <img
                src={showroomEsterno}
                alt={`Showroom ${NOME} ${CITTA}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 text-left space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-brand">SEDE PRINCIPALE</p>
                <p className="text-xs font-bold text-white uppercase">{INDIRIZZO}, {CITTA}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 110 CHECK QUALITY PROTOCOL (NEW COMPREHENSIVE SECTION) */}
        <div className="border-t border-neutral-900 pt-16 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-brand">RIGORE TECNICO</span>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">IL NOSTRO PROTOCOLLO DI CONTROLLO</h2>
            <p className="text-xs text-neutral-400 max-w-2xl mx-auto font-normal">
              Prima di ricevere il sigillo "Paroc Auto", ogni vettura viene sottoposta ad un ciclo intensivo di perizie e manutenzioni preventive. Ecco come garantiamo l'affidabilità totale:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {protocolSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-6 flex gap-4 hover:border-brand/30 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-white">{step.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FINANCIAL PARTNERSHIPS SECTION (NEW SECTION) */}
        <div className="border-t border-neutral-900 pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 order-2 lg:order-1 bg-neutral-950 border border-neutral-900 p-6 rounded-2xl text-left space-y-4"
          >
            <div className="h-10 w-10 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-sm uppercase font-bold tracking-wider text-white">Finanziamenti da 30 a 80 rate</h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-normal">
              La nostra collaborazione diretta con i colossi del credito automobilistico ci consente di formulare piani ad anticipo zero, tassi d'interesse agevolati bloccati e rateazioni estese fino a 80 mesi.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-md">Partner Findomestic</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-md">Partner Santander</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-md">Fiditalia</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-left"
          >
            <span className="text-xs uppercase font-bold tracking-wider text-brand">SOSTENIBILITÀ DI ACQUISTO</span>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight">SOLUZIONI FINANZIARIE ACCESSIBILI E REALI</h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
              Riteniamo che acquistare un'auto debba essere un piacere, non un peso finanziario. Per questo collaboriamo con i principali istituti di credito italiani per assicurarci che tu possa dilazionare l'importo in totale comfort, inserendo coperture furto/incendio, kasko, o manutenzioni all'interno della stessa rata fissa mensile.
            </p>
          </motion.div>
        </div>

        {/* Core Values Section */}
        <div className="text-center space-y-12 border-t border-neutral-900 pt-16">
          <div className="space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-brand">I NOSTRI PILASTRI</span>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">I VALORI DI {NOME.toUpperCase()} {CITTA.toUpperCase()}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {values.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 space-y-3 hover:border-brand/35 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  {val.icon}
                </div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-white">{val.title}</h3>
                <p className="text-xs text-neutral-400 leading-normal font-normal">{val.description}</p>
              </motion.div>
            ))}
          </div>
        </div>


        {/* Elegant Delivery visual callout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-t border-neutral-900 pt-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 order-2 lg:order-1 relative"
          >
            <div className="rounded-2xl overflow-hidden border border-neutral-900 aspect-[4/3] shadow-2xl relative group bg-neutral-950">
              <img
                src={showroomInterno}
                alt={`Interno showroom ${NOME} ${CITTA}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-left"
          >
            <span className="text-xs uppercase font-bold tracking-wider text-brand">RELAZIONE DURATURA</span>
            <h2 className="font-display text-3xl font-black text-white uppercase tracking-tight leading-tight">
              ASSISTENZA CONTINUA POST-VENDITA
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-neutral-405 leading-relaxed font-normal text-neutral-400">
              <p>
                Il nostro legame con il cliente si consolida dopo la consegna. Gestiamo tutte le scadenze dei tagliandi, coordinando riparazioni rapide e carrozzeria di precisione tramite la nostra fitta rete di officine partner certificate dislocate a {CITTA} e provincia.
              </p>
              <p>
                Più di 1.500 famiglie e imprese del territorio hanno scelto la trasparenza di {RAGIONE}. Lasciati consigliare da chi mette la passione e l'affidabilità davanti a tutto.
              </p>
            </div>
            
            <div className="pt-4">
              <button
                onClick={onNavigateToContacts}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand/90 text-white font-bold text-xs px-6 py-3.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
              >
                Parla con un consulente
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <ShowroomGallery />
    </div>
  );
}
