import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, Shield, Check, Calendar, Gauge, Zap, Phone, Mail, MessageSquare,
  Award, ShieldAlert, Sparkles, CheckCircle, CheckCircle2, RefreshCw, Car as CarIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Car } from '../types';
import ContactForm from './ContactForm';
import PermutaForm from './PermutaForm';
import TestDriveForm from './TestDriveForm';
import FinancingCalculator from './FinancingCalculator';
import { TEL, TEL_HREF, WA_HREF, waLink, NOME, RAGIONE, CITTA } from '../lib/brand';

interface CarDetailPageProps {
  cars: Car[];
  carId: string;
  onBack: () => void;
  onInquire: (carName: string) => void;
  onNavigateToGaranzia: () => void;
}

export default function CarDetailPage({ cars, carId, onBack, onInquire, onNavigateToGaranzia }: CarDetailPageProps) {
  const car = useMemo(() => {
    return cars.find(c => c.id === carId);
  }, [cars, carId]);

  // Auto scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [carId]);

  // Formatting helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const formatKm = (km: number) => {
    return new Intl.NumberFormat('it-IT').format(km) + ' km';
  };

  // Scheda tecnica basata solo sui dati reali inseriti nel pannello.
  // I campi non compilati per questo annuncio semplicemente non vengono mostrati.
  // IMPORTANTE: questo hook (e tutti quelli sotto) devono restare SEMPRE PRIMA
  // dell'eventuale "if (!car) return" più sotto: React richiede lo stesso numero
  // di hook ad ogni render, altrimenti va in errore #310 (successo solo al refresh
  // diretto di una pagina auto, quando "cars" è ancora vuoto al primissimo render).
  const specs = useMemo(() => {
    if (!car) return [];
    const righe: { label: string; value: string }[] = [
      { label: 'Marca', value: car.brand },
      { label: 'Modello', value: car.modello || car.model.replace(car.brand, '').trim() },
      { label: 'Versione', value: car.model },
      { label: 'Anno di Immatricolazione', value: car.year.toString() },
      { label: 'Chilometraggio', value: formatKm(car.km) },
      { label: 'Alimentazione', value: car.fuelType },
      { label: 'Tipo di Cambio', value: car.gearbox },
    ];

    if (car.power) righe.push({ label: 'Potenza', value: car.power });
    if (car.condizione) righe.push({ label: 'Condizione', value: car.condizione });
    if (car.carrozzeria) righe.push({ label: 'Carrozzeria', value: car.carrozzeria });
    if (car.colore) righe.push({ label: 'Colore', value: car.colore });
    if (car.porte) righe.push({ label: 'Porte', value: car.porte });
    if (car.posti) righe.push({ label: 'Posti', value: car.posti.toString() });
    if (car.classeEmissioni) righe.push({ label: 'Classe Emissioni', value: car.classeEmissioni });

    return righe;
  }, [car]);

  // Gallery reale caricata dal pannello annunci (fallback alla cover se manca)
  const carImages = car && car.images && car.images.length > 0 ? car.images : car ? [car.image] : [];
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Tab attiva nel blocco form in fondo alla pagina; i bottoni rapidi sotto la
  // galleria impostano questa tab e scrollano fino al form.
  const [activeTab, setActiveTab] = useState<'contatti' | 'permuta' | 'test-drive'>('contatti');

  const goToTab = (tab: 'contatti' | 'permuta' | 'test-drive') => {
    setActiveTab(tab);
    document.getElementById('inquiry-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!car) {
    return (
      <div className="pt-32 pb-16 bg-black text-white min-h-screen text-center px-4">
        <p className="text-neutral-400">Questo annuncio non è più disponibile.</p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna a Parco Auto
        </button>
      </div>
    );
  }

  // Blocchi estratti in variabili così possiamo comporli in ordine diverso
  // su mobile (foto -> prezzo -> scheda -> descrizione -> qualità -> servizi)
  // e su desktop (colonna sinistra/destra come da design originale),
  // senza duplicare la galleria foto (evita doppio caricamento immagini).

  const qualityCallout = (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 space-y-4 text-left">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white border-b border-neutral-900 pb-2.5 flex items-center gap-2">
        <Award className="h-4 w-4 text-brand" />
        LA NOSTRA PROMESSA DI QUALITÀ
      </h3>
      <p className="text-xs text-neutral-400 leading-relaxed">
        Tutte le vetture proposte da {RAGIONE} superano un rigido protocollo di controllo. Non acquistiamo né rivendiamo auto incidentate o con chilometraggio non documentato.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="flex items-start gap-2.5">
          <CheckCircle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-neutral-200 block">110 Controlli Tecnici</span>
            <span className="text-[11px] text-neutral-500">Meccanica, elettronica, carrozzeria e impianti di sicurezza controllati.</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckCircle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-neutral-200 block">Chilometri Certificati</span>
            <span className="text-[11px] text-neutral-500">Dichiarati in fattura e sul contratto di vendita per iscritto.</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckCircle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-neutral-200 block">Garanzia 12-36 Mesi</span>
            <span className="text-[11px] text-neutral-500">Garanzia legale di conformità con soccorso stradale h24 Europa incluso.</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckCircle className="h-4 w-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-neutral-200 block">Igienizzazione Professionale</span>
            <span className="text-[11px] text-neutral-500">Trattamento ad ozono completo prima di essere consegnata.</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNavigateToGaranzia}
        className="text-xs font-bold text-brand hover:underline pt-1"
      >
        Leggi tutte le condizioni di garanzia e vendita →
      </button>
    </div>
  );

  const specSheet = (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 space-y-4 text-left">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white border-b border-neutral-900 pb-2.5">
        SCHEDA TECNICA DETTAGLIATA
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
        {specs.map((spec, i) => (
          <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-neutral-900/60 last:border-0 md:last:border-b">
            <span className="text-neutral-400 font-medium">{spec.label}</span>
            <span className="text-neutral-200 font-bold text-right">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const descriptionBlock = car.descrizione ? (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 space-y-3 text-left">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white border-b border-neutral-900 pb-2.5">
        DESCRIZIONE
      </h3>
      <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
        {car.descrizione}
      </p>
    </div>
  ) : null;

  const dotazioniBlock = car.accessori && car.accessori.length > 0 ? (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 space-y-4 text-left">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white border-b border-neutral-900 pb-2.5">
        DOTAZIONI
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5">
        {car.accessori.map((accessorio, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
            <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
            {accessorio}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const pricingCard = (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
      <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-brand/10 to-transparent pointer-events-none" />

      <div className="space-y-2">
        <span className="text-xs uppercase font-bold tracking-wider text-brand">PREZZO CHIAVI IN MANO</span>
        <p className="font-display text-5xl font-black text-white tracking-tight">
          {formatPrice(car.price)}
        </p>
        <p className="text-[11px] text-neutral-500 leading-none">Passaggio di proprietà escluso • Iva esposta inclusa</p>
      </div>

      <div className="grid grid-cols-3 gap-3 py-1 text-center">
        <div className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-xl">
          <Calendar className="h-5 w-5 text-brand mx-auto mb-1.5" />
          <span className="text-[10px] text-neutral-500 font-medium uppercase block">Immatr.</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{car.year}</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-xl">
          <Gauge className="h-5 w-5 text-brand mx-auto mb-1.5" />
          <span className="text-[10px] text-neutral-500 font-medium uppercase block">Percorrenza</span>
          <span className="text-sm font-bold text-white mt-0.5 block line-clamp-1">{formatKm(car.km).replace(' ', '')}</span>
        </div>
        <div className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-xl">
          <Zap className="h-5 w-5 text-brand mx-auto mb-1.5" />
          <span className="text-[10px] text-neutral-500 font-medium uppercase block">Motore</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{car.power || 'N/D'}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2.5 text-xs text-neutral-400">
          <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
          Auto controllata e certificata da {RAGIONE}
        </div>
        <div className="flex items-center gap-2.5 text-xs text-neutral-400">
          <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
          Possibilità di finanziamento e permuta
        </div>
        <div className="flex items-center gap-2.5 text-xs text-neutral-400">
          <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
          Risposta garantita entro 2 ore lavorative
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onInquire(`${car.brand} ${car.model}`)}
          className="w-full sm:col-span-2 bg-brand hover:bg-brand/90 text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-md text-center"
        >
          Richiedi Informazioni Immediate
        </button>
        {TEL && (
          <a
            href={TEL_HREF}
            className="w-full bg-neutral-900 border border-neutral-800 hover:border-brand text-neutral-200 hover:text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2"
          >
            <Phone className="h-4 w-4 text-brand" />
            Chiama
          </a>
        )}
        {WA_HREF && (
          <a
            href={waLink(`Salve, sono interessato/a a ${car.brand} ${car.model} (${formatPrice(car.price)}) vista sul sito. Potrei avere maggiori informazioni?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );

  const servicesCard = (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-6 text-left relative">
      <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
        <Shield className="h-5 w-5 text-brand" />
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">SERVIZI SU MISURA PER TE</h3>
          <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{RAGIONE} • Soluzioni Certificate</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4.5 w-4.5 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-neutral-200 block uppercase tracking-wider">Finanziamenti Personalizzati</span>
            <span className="text-[11px] text-neutral-400">Piani flessibili con tassi agevolati in collaborazione con Findomestic e Santander.</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4.5 w-4.5 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-neutral-200 block uppercase tracking-wider">Valutazione Permuta</span>
            <span className="text-[11px] text-neutral-400">Ritiro e supervalutazione del tuo usato con perizia immediata e certificata.</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-4.5 w-4.5 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-neutral-200 block uppercase tracking-wider">Pratiche in Sede</span>
            <span className="text-[11px] text-neutral-400">Gestione burocratica e passaggio di proprietà rapido in sede per una consegna senza pensieri.</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-900">
        <button
          onClick={() => onInquire(`${car.brand} ${car.model} (Richiesta servizi e finanziamenti)`)}
          className="w-full bg-neutral-900 hover:bg-brand border border-neutral-800 hover:border-brand text-neutral-200 hover:text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
        >
          Richiedi Maggiori Dettagli
        </button>
      </div>
    </div>
  );

  return (
    <div className="pt-24 pb-16 bg-black text-white min-h-screen">
      {/* Back navigation banner */}
      <div className="bg-neutral-950 border-b border-neutral-900 py-4 px-4 sticky top-[73px] z-20 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors py-1 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-brand" />
            Torna a Parco Auto
          </button>
          
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">In esposizione a {CITTA}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Riga superiore: galleria + box prezzo affiancati su desktop, impilati su mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-7 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-brand font-bold">{NOME.toUpperCase()} • USATO SELEZIONATO</p>
              <h1 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-none mt-1">
                {car.brand} {car.modello && <span className="text-white">{car.modello}</span>}{' '}
                <span className="text-neutral-400">{car.model}</span>
              </h1>
            </div>

            <div className="relative aspect-16/10 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
              <img
                src={carImages[activeImageIdx]}
                alt={`${car.brand} ${car.model}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-500"
              />

              {carImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIdx((i) => (i - 1 + carImages.length) % carImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs hover:bg-black/70 transition-colors cursor-pointer"
                    aria-label="Foto precedente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIdx((i) => (i + 1) % carImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs hover:bg-black/70 transition-colors cursor-pointer"
                    aria-label="Foto successiva"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {car.badge && (
                <span className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-brand/90 px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase backdrop-blur-xs shadow-lg">
                  <Shield className="h-4 w-4" />
                  {car.badge}
                </span>
              )}
            </div>

            {/* Striscia thumbnail: scorrimento orizzontale, sempre una riga sola
                anche con tante foto (prima era una grid a 3 colonne che si allungava
                verso il basso a ogni riga di foto in più). */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {carImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`shrink-0 w-24 aspect-16/10 rounded-xl overflow-hidden border transition-all ${
                    activeImageIdx === idx 
                      ? 'border-brand ring-1 ring-brand bg-neutral-900' 
                      : 'border-neutral-900 hover:border-neutral-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="car detail thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {pricingCard}

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => goToTab('permuta')}
                className="flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-brand hover:text-white text-neutral-300 font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 text-brand" />
                Permuta
              </button>
              <button
                onClick={() => goToTab('test-drive')}
                className="flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-brand hover:text-white text-neutral-300 font-bold text-xs py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
              >
                <CarIcon className="h-4 w-4 text-brand" />
                Test Drive
              </button>
            </div>

            <FinancingCalculator carPrice={car.price} />
          </div>
        </div>

        {/* Tutto il resto: a piena larghezza, impilato, con ordine diverso su mobile vs desktop */}
        <div className="flex flex-col gap-8 mt-8">
          <div className="order-3 lg:order-1">{qualityCallout}</div>
          <div className="order-1 lg:order-2">{specSheet}</div>
          <div className="order-2 lg:order-3">{dotazioniBlock}</div>
          <div className="order-2 lg:order-3">{descriptionBlock}</div>
          <div className="order-4 lg:order-4">{servicesCard}</div>
        </div>

        {/* Embedded Contact / Permuta / Test Drive Tabs at bottom */}
        <div id="inquiry-tabs-section" className="border-t border-neutral-900 pt-16 mt-16 text-left scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center space-y-2 mb-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand font-mono">CONTATTA IL NOSTRO TEAM</span>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">PRENOTA UN TEST DRIVE O RICHIEDI INFORMAZIONI</h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Hai domande su questa {car.brand} {car.model}? Scegli cosa ti serve: informazioni, valutazione della tua permuta o una prova su strada.
            </p>
          </div>

          <div className="max-w-3xl mx-auto flex gap-2 mb-2">
            {([
              { key: 'contatti', label: 'Contattaci' },
              { key: 'permuta', label: 'Permuta' },
              { key: 'test-drive', label: 'Richiedi Test Drive' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-brand text-white'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-3xl mx-auto rounded-2xl rounded-tl-none border border-neutral-800 bg-neutral-950 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {activeTab === 'contatti' && (
              <ContactForm cars={cars} selectedCar={`${car.brand} ${car.model}`} setSelectedCar={() => {}} locked />
            )}
            {activeTab === 'permuta' && <PermutaForm carLabel={`${car.brand} ${car.model}`} />}
            {activeTab === 'test-drive' && <TestDriveForm carLabel={`${car.brand} ${car.model}`} />}
          </div>
        </div>
      </div>
    </div>
  );
}