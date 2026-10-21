/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car as CarIcon,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  Clock,
  MapPin,
  Star,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Award,
  Users,
  CalendarDays
} from 'lucide-react';

// Static Data and Components
import { trustPoints, services, processSteps } from './data';
import { fetchCars } from './lib/fetchCars';
import { setPageMeta } from './lib/seo';
import { metaPagina } from './lib/seoPagine';
import { trackingConfigurato, leggiConsenso, salvaConsenso, caricaTracking, tracciaPagina, type SceltaCookie } from './lib/tracking';
import CookieBanner from './components/CookieBanner';
import DemoBar from './components/DemoBar';
import ReviewCard from './components/ReviewCard';
import { reviews } from './data';
import WidgetRecensioni, { widgetRecensioniAttivo } from './components/WidgetRecensioni';
import { Car } from './types';
import CarCard from './components/CarCard';
import { Suspense } from 'react';
import GaranziaPage from './components/GaranziaPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TerminiUtilizzoPage from './components/TerminiUtilizzoPage';
import AziendaPage from './components/AziendaPage';
import UsatoGarantitoPage from './components/UsatoGarantitoPage';
import CarDetailPage from './components/CarDetailPage';
import FAQPage from './components/FAQPage';
import ContattiPage from './components/ContattiPage';
import ServiceCard from './components/ServiceCard';
import ContactForm from './components/ContactForm';
import StickyMobileCTA from './components/StickyMobileCTA';

// Logo aziendale
import { cliente } from '@cliente/cliente.config';
const logoSrc = `/brand/${cliente.brand.logo.chiaro}`;

// Import our beautiful custom generated showroom hero image
import heroBg from './assets/images/showroom/showroom-hero-nuova.webp';
import showroomInternoBento from './assets/images/showroom/showroom-sinfonia.webp';
import carKeys from './assets/images/showroom/showroom-trasparenza.webp';
import { DEMO, ORARI, fasceTesto, TEL, TEL_HREF, CELL, CELL_HREF, EMAIL, WA_HREF, waLink, MAPPA_LINK, MAPPA_EMBED, NOME, RAGIONE, CITTA, REGIONE, INDIRIZZO, CAP_CITTA, SEDE_LEGALE, DATI_LEGALI } from './lib/brand';

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-neutral-800 border-t-brand animate-spin" />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<'home' | 'azienda' | 'usato-garantito' | 'faq' | 'contatti' | 'car-detail' | 'garanzia' | 'privacy' | 'termini'>('home');
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCarFilter, setSelectedCarFilter] = useState<'Tutti' | 'Benzina' | 'Diesel' | 'Ibrida' | 'Elettrica'>('Tutti');
  const [inquiryCar, setInquiryCar] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  // Banner cookie solo se c'è davvero del tracking da autorizzare
  const [bannerCookie, setBannerCookie] = useState(() => trackingConfigurato && leggiConsenso() === null);

  const sceltaCookie = (scelta: SceltaCookie) => {
    salvaConsenso(scelta);
    setBannerCookie(false);
    if (scelta === 'accepted') caricaTracking(true);
  };

  useEffect(() => {
    fetchCars()
      .then(setCars)
      .finally(() => setCarsLoading(false));
  }, []);

  // Ogni pagina ha ora un URL reale (es. #/parco-auto/{id}), condivisibile e che sopravvive
  // al refresh. Questo effetto legge l'URL e aggiorna lo stato interno che pilota il resto
  // del componente, così tutta la logica esistente sotto (basata su currentPage) resta invariata.
  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith('/parco-auto/')) {
      const id = path.replace('/parco-auto/', '');
      setSelectedCarId(id);
      setCurrentPage('car-detail');
    } else if (path === '/parco-auto') {
      setCurrentPage('usato-garantito');
    } else if (path === '/azienda') {
      setCurrentPage('azienda');
    } else if (path === '/faq') {
      setCurrentPage('faq');
    } else if (path === '/garanzia') {
      setCurrentPage('garanzia');
    } else if (path === '/contatti') {
      setCurrentPage('contatti');
    } else if (path === '/privacy') {
      setCurrentPage('privacy');
    } else if (path === '/termini') {
      setCurrentPage('termini');
    } else {
      setCurrentPage('home');
    }

    // Title/description della pagina dal config (src/lib/seoPagine.ts)
    const auto = path.startsWith('/parco-auto/') ? cars.find((c) => c.id === path.replace('/parco-auto/', '')) : undefined;
    const meta = metaPagina(path, auto);
    if (meta) setPageMeta({ ...meta, path });

    // page_view GA4/GTM (parte solo se tracking configurato + consenso dato)
    tracciaPagina(path);
  }, [location.pathname, cars]);

  const handleSelectCar = (carId: string) => {
    navigate(`/parco-auto/${carId}`);
  };

  // Scroll to top a ogni cambio pagina
  // (il title/description/canonical li gestisce già setPageMeta nell'effect sopra;
  // prima c'era qui un secondo blocco che risettava document.title con un testo
  // diverso subito dopo, andando in conflitto con quello ottimizzato per SEO)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage, selectedCarId]);

  // Scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle vehicle inquiry from card clicking
  const handleInquireVehicle = (carName: string) => {
    setInquiryCar(carName);
    const formSection = document.getElementById('contatti-sezione');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
      
      // Focus on the form container after scroll
      setTimeout(() => {
        const nameInput = document.getElementById('name-input');
        if (nameInput) nameInput.focus();
      }, 800);
    }
  };

  // Filter cars list
  const filteredCars = cars.filter((car) => {
    if (selectedCarFilter === 'Tutti') return true;
    return car.fuelType.toLowerCase() === selectedCarFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased overflow-x-hidden relative">
      
      {/* Background elegant abstract blue radial glow */}
      <div className="absolute top-[20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-brand/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[25%] right-[-10%] h-[600px] w-[600px] rounded-full bg-brand/5 blur-[150px] pointer-events-none" />

      {/* Header/Nav */}
      <header
        id="main-header"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-black/90 border-neutral-900/80 backdrop-blur-md py-4 shadow-lg'
            : 'bg-transparent border-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center focus:outline-none cursor-pointer"
          >
            <img 
              src={logoSrc} 
              alt="Parco Auto Logo" 
              className="h-14 sm:h-16 md:h-18 w-auto object-contain py-1"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider">
            <button
              onClick={() => navigate('/')}
              className={`transition-colors duration-200 uppercase tracking-wider text-xs font-semibold cursor-pointer ${
                currentPage === 'home' ? 'text-brand font-bold' : 'hover:text-brand text-neutral-400'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate('/azienda')}
              className={`transition-colors duration-200 uppercase tracking-wider text-xs font-semibold cursor-pointer ${
                currentPage === 'azienda' ? 'text-brand font-bold' : 'hover:text-brand text-neutral-400'
              }`}
            >
              Azienda
            </button>
            <button
              onClick={() => navigate('/parco-auto')}
              className={`transition-colors duration-200 uppercase tracking-wider text-xs font-semibold cursor-pointer ${
                currentPage === 'usato-garantito' ? 'text-brand font-bold' : 'hover:text-brand text-neutral-400'
              }`}
            >
              Parco Auto
            </button>
            <button
              onClick={() => navigate('/faq')}
              className={`transition-colors duration-200 uppercase tracking-wider text-xs font-semibold cursor-pointer ${
                currentPage === 'faq' ? 'text-brand font-bold' : 'hover:text-brand text-neutral-400'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => navigate('/contatti')}
              className={`transition-colors duration-200 uppercase tracking-wider text-xs font-semibold cursor-pointer ${
                currentPage === 'contatti' ? 'text-brand font-bold' : 'hover:text-brand text-neutral-400'
              }`}
            >
              Contatti
            </button>
          </nav>

          {/* Direct call button desk */}
          <div className="hidden md:flex items-center gap-4">
            {TEL && (
              <a
                href={TEL_HREF}
                id="header-call-btn"
                className="flex items-center gap-2 border border-neutral-800 hover:border-brand bg-neutral-950/50 hover:bg-brand hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 group"
              >
                <Phone className="h-3.5 w-3.5 text-brand group-hover:text-white transition-colors" />
                {TEL}
              </a>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded bg-neutral-950 border border-neutral-900 text-neutral-300 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-[73px] left-0 right-0 bg-black/95 border-b border-neutral-900 z-30 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6 text-sm font-semibold uppercase tracking-wider text-neutral-300">
              <button
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                className={`text-left hover:text-brand py-1 transition-colors uppercase cursor-pointer ${
                  currentPage === 'home' ? 'text-brand font-bold' : 'text-neutral-300'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => { navigate('/azienda'); setMobileMenuOpen(false); }}
                className={`text-left hover:text-brand py-1 transition-colors uppercase cursor-pointer ${
                  currentPage === 'azienda' ? 'text-brand font-bold' : 'text-neutral-300'
                }`}
              >
                Azienda
              </button>
              <button
                onClick={() => { navigate('/parco-auto'); setMobileMenuOpen(false); }}
                className={`text-left hover:text-brand py-1 transition-colors uppercase cursor-pointer ${
                  currentPage === 'usato-garantito' ? 'text-brand font-bold' : 'text-neutral-300'
                }`}
              >
                Parco Auto
              </button>
              <button
                onClick={() => { navigate('/faq'); setMobileMenuOpen(false); }}
                className={`text-left hover:text-brand py-1 transition-colors uppercase cursor-pointer ${
                  currentPage === 'faq' ? 'text-brand font-bold' : 'text-neutral-300'
                }`}
              >
                FAQ
              </button>
              <button
                onClick={() => { navigate('/contatti'); setMobileMenuOpen(false); }}
                className={`text-left hover:text-brand py-1 transition-colors uppercase cursor-pointer ${
                  currentPage === 'contatti' ? 'text-brand font-bold' : 'text-neutral-300'
                }`}
              >
                Contatti
              </button>
              {TEL && (
                <a
                  href={TEL_HREF}
                  className="flex items-center justify-center gap-2 border border-brand bg-brand/10 hover:bg-brand text-white py-3 rounded-lg text-xs font-bold transition-all mt-2"
                >
                  <Phone className="h-4 w-4" />
                  CHIAMA: {TEL}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentPage === 'home' ? (
        <>
          {/* 1. Hero Section */}
      <section id="hero-sezione" className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
        {/* Background custom generated showroom image with advanced high-contrast dark overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt={`${RAGIONE} Showroom`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-105 saturate-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
          {/* Tono blu brand più marcato sulla foto reale (che di suo è calda/al tramonto) */}
          <div className="absolute inset-0 bg-brand/25 mix-blend-color" />
          <div className="absolute inset-0 bg-brand/10 mix-blend-overlay" />
        </div>

        {/* Content container */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-16 md:py-24 text-left">
          <div className="max-w-3xl space-y-8">
            {/* Hero Logo */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-2"
            >
              <img 
                src={logoSrc} 
                alt="Parco Auto Logo" 
                className="h-20 sm:h-24 md:h-28 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Tag/Badge */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-brand uppercase backdrop-blur-xs"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              CONCESSIONARIA MULTIMARCA A {CITTA.toUpperCase()}
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight uppercase"
            >
              {NOME.toUpperCase()} <br />
              <span className="text-brand">{CITTA.toUpperCase()}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed font-normal max-w-2xl"
            >
              Vendita usato selezionato, nuovo e formule di noleggio personalizzate. 
              Garanzia Europea 12 mesi inclusa e finanziamenti innovativi fino a 80 rate. 
              Trasparenza totale, nessuna pressione nella scelta.
            </motion.p>

             {/* CTA Dual buttons */}
             <motion.div
               initial={false}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               className="flex flex-col sm:flex-row gap-4 pt-4"
             >
               {/* Call CTA */}
               {TEL && (
                 <a
                   href={TEL_HREF}
                   id="hero-cta-call"
                   className="flex items-center justify-center gap-3 bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-xl text-xs tracking-widest font-bold uppercase transition-all duration-300 hover:scale-102 hover:shadow-[0_8px_25px_rgba(0,71,255,0.4)] cursor-pointer"
                 >
                   <Phone className="h-4 w-4" />
                   Chiama Ora • {TEL}
                 </a>
               )}

               {/* Whatsapp CTA */}
               {WA_HREF && (
                 <a
                   href={waLink('Salve, vorrei informazioni sulle vostre auto in vetrina.')}
                   target="_blank"
                   rel="noopener noreferrer"
                   id="hero-cta-whatsapp"
                   className="flex items-center justify-center gap-3 border border-neutral-700 hover:border-emerald-500 bg-black/40 hover:bg-emerald-600/10 text-white px-8 py-4 rounded-xl text-xs tracking-widest font-bold uppercase transition-all duration-300 hover:scale-102"
                 >
                   <MessageSquare className="h-4 w-4 text-emerald-400" />
                   Scrivi su WhatsApp
                 </a>
               )}
               {/* Senza telefono/WhatsApp (es. demo): CTA verso parco auto e form */}
               {!TEL && !WA_HREF && (
                 <>
                   <button
                     onClick={() => navigate('/parco-auto')}
                     className="flex items-center justify-center gap-3 bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-xl text-xs tracking-widest font-bold uppercase transition-all duration-300 hover:scale-102 cursor-pointer"
                   >
                     <ArrowUpRight className="h-4 w-4" />
                     Scopri il parco auto
                   </button>
                   <button
                     onClick={() => navigate('/contatti')}
                     className="flex items-center justify-center gap-3 border border-neutral-700 hover:border-brand bg-black/40 text-white px-8 py-4 rounded-xl text-xs tracking-widest font-bold uppercase transition-all duration-300 hover:scale-102 cursor-pointer"
                   >
                     <MessageSquare className="h-4 w-4 text-brand" />
                     Richiedi informazioni
                   </button>
                 </>
               )}
             </motion.div>

            {/* Safety tag */}
            <motion.div
              initial={false}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-3 text-xs text-neutral-400 font-medium"
            >
              <ShieldCheck className="h-4 w-4 text-brand" />
              <span>Chilometri certificati in fattura • Personale qualificato • Salone accogliente</span>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-neutral-500 hover:text-white transition-colors duration-200">
          <span className="text-[9px] uppercase tracking-widest font-bold">Esplora</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-6 w-4 border border-neutral-700 rounded-full flex justify-center p-1"
          >
            <div className="h-1.5 w-1 bg-brand rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* 2. Perché {NOME} (Trust bar) */}
      <section id="trust-bar" className="relative z-10 border-y border-neutral-900 bg-neutral-950/60 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {trustPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="space-y-2 text-left"
              >
                <div className="h-1 bg-brand w-8 mb-4 rounded-full" />
                <h4 className="font-display text-lg font-bold text-white uppercase tracking-tight">
                  {point.title}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                  {point.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Chi Siamo / Storia */}
      <section id="storia" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Col: Typographic Layout */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                LA NOSTRA SINFONIA
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-white leading-tight uppercase">
                UNA REALTÀ DI FIDUCIA <br />
                NEL CUORE DI {CITTA.toUpperCase()}
              </h2>
              <div className="h-1 bg-brand w-16 my-4 rounded-full" />
              
              <p className="text-sm leading-relaxed text-neutral-300 font-normal">
                {RAGIONE} nasce con l’obiettivo di ridefinire l’esperienza d’acquisto automobilistica. In un mercato complesso, abbiamo scelto di distinguerci attraverso tre pilastri irrinunciabili: <strong>professionalità</strong>, <strong>totale trasparenza</strong> ed <strong>empatia</strong> con il cliente. 
              </p>
              <p className="text-sm leading-relaxed text-neutral-300 font-normal">
                Nel nostro salone curato in {INDIRIZZO} a {CITTA}, sarai accolto da un team che ha maturato una tradizione decennale nel settore. La nostra missione è guidarti verso la scelta perfetta per le tue esigenze, senza alcuna fretta, pressione commerciale o vincoli nascosti. Ogni vettura del nostro parco auto multimarca viene sottoposta a rigorosi controlli meccanici e di carrozzeria prima di essere esposta.
              </p>
              
              <div className="pt-4 flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/contatti')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-brand hover:text-white transition-colors group cursor-pointer"
                >
                  PRENOTA UNA VISITA IN SEDE
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Col: Image & Stat Bento Grid */}
            <div className="lg:col-span-6 space-y-6">
              {/* Premium image to break up text as requested */}
              <div className="relative rounded-2xl overflow-hidden border border-neutral-900 aspect-16/9 bg-neutral-950 group shadow-2xl">
                <img
                  src={showroomInternoBento}
                  alt={`Showroom ${NOME} ${CITTA}, esposizione interna`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-white">Esposizione {CITTA} • Tradizione e Passione</span>
                </div>
              </div>

              {/* Bento Stats row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 text-left space-y-1.5 hover:border-brand/25 transition-colors">
                  <Award className="h-6 w-6 text-brand mb-1" />
                  <p className="font-display text-2xl font-black text-white tracking-tight">100%</p>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Garanzia Certificata</p>
                  <p className="text-[11px] text-neutral-500 leading-normal">Chilometri reali garantiti per iscritto sul contratto.</p>
                </div>

                <div className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5 text-left space-y-1.5 hover:border-brand/25 transition-colors">
                  <Users className="h-6 w-6 text-brand mb-1" />
                  <p className="font-display text-2xl font-black text-white tracking-tight">1500+</p>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Clienti Soddisfatti</p>
                  <p className="text-[11px] text-neutral-500 leading-normal">Recensioni eccellenti e clienti fedeli nel tempo.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Servizi Offerti */}
      <section id="servizi" className="py-24 md:py-32 bg-neutral-950/40 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-left space-y-4 max-w-2xl mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              SERVIZI A 360 GRADI
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
              TUTTO CIÒ DI CUI HAI BISOGNO
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed font-normal">
              Dalla scelta dell’auto al post-vendita. Offriamo un pacchetto completo di servizi finanziari, assicurativi ed assistenziali, garantendo un’unica e affidabile interfaccia per ogni necessità.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((srv) => (
              <ServiceCard key={srv.id} service={srv} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Vetrina Parco Auto */}
      <section id="usato-garantito-sezione" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Header with dynamic filter buttons */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 text-left">
            <div className="space-y-4 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                AUTO CERTIFICATE IN PRONTA CONSEGNA
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                PARCO AUTO
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed font-normal">
                Questi sono solo alcuni esempi delle nostre migliori vetture a {CITTA}. Clicca su una vettura per vederne la scheda dettagliata e le caratteristiche complete.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {(['Tutti', 'Benzina', 'Diesel', 'Ibrida', 'Elettrica'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedCarFilter(filter)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    selectedCarFilter === filter
                      ? 'bg-brand text-white shadow-md'
                      : 'bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Cars Grid */}
          {carsLoading ? (
            <div className="text-center py-16">
              <p className="text-neutral-500">Caricamento parco auto...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredCars.slice(0, 3).map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      onSelect={handleSelectCar}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {filteredCars.length === 0 && (
                <div className="text-center py-16 border border-neutral-900 rounded-xl bg-neutral-950/20">
                  <p className="text-neutral-500 italic">Nessun veicolo {selectedCarFilter.toLowerCase()} disponibile in vetrina al momento.</p>
                  <button
                    onClick={() => setSelectedCarFilter('Tutti')}
                    className="mt-4 text-brand font-bold text-xs uppercase hover:underline"
                  >
                    Mostra tutte le auto
                  </button>
                </div>
              )}
            </>
          )}

          {/* Grid Footer CTA */}
          <div className="mt-16 text-center space-y-4">
            <p className="text-sm text-neutral-400 max-w-md mx-auto">
              Cerchi un modello specifico che non vedi qui? Lo troviamo noi per te grazie al nostro network multimarca.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate('/parco-auto')}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand/90 text-white px-6 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-md hover:scale-102"
              >
                Scopri di più
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleInquireVehicle('Richiesta Ricerca Auto Custom')}
                className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-brand hover:text-white text-neutral-300 px-6 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer"
              >
                Voglio cercare un'altra auto
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/contatti')}
                className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-neutral-400 hover:text-white transition-colors py-3 cursor-pointer"
              >
                VIENI A TROVARCI IN SALONE
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Come funziona / Processo d'acquisto */}
      <section id="come-funziona" className="py-24 md:py-32 bg-neutral-950/40 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-left space-y-4 max-w-2xl mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              METODO {NOME.toUpperCase()}
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
              IL TUO PERCORSO SENZA PENSIERI
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed font-normal">
              Siamo convinti che l’acquisto dell’auto debba essere un momento piacevole. Abbiamo semplificato ogni passaggio eliminando burocrazia complessa e clausole poco chiare.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative group space-y-3 text-left"
              >
                {/* Large Background Step Number */}
                <span className="absolute -top-12 left-0 font-display text-8xl font-black text-neutral-900/40 group-hover:text-brand/10 transition-colors pointer-events-none select-none">
                  {step.number}
                </span>

                <div className="relative pt-6">
                  <div className="h-1 bg-brand w-6 mb-4 rounded-full" />
                  <h4 className="font-display text-lg font-bold text-white uppercase tracking-tight">
                    {step.title}
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-2 font-normal">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Visual Callout for Delivery / Handover - Adds requested photos, breaks up text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="mt-16 rounded-2xl border border-neutral-800 bg-neutral-950/80 overflow-hidden shadow-2xl relative"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 h-[260px] lg:h-auto min-h-[260px] relative">
                <img
                  src={carKeys}
                  alt={`Piazzale esterno ${NOME} ${CITTA}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r lg:bg-gradient-to-l from-transparent via-transparent to-black/30" />
              </div>
              <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-center text-left space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand font-mono">SERVIZIO CERTIFICATO CHIAVI IN MANO</span>
                <h3 className="font-display text-2xl font-bold text-white uppercase tracking-tight">TRASPARENZA DA INIZIO A FINE</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                  Dalla perizia attenta del tuo usato alla consegna finale. Ogni auto viene igienizzata professionalmente prima della consegna ed accompagnata dal certificato ufficiale di conformità che garantisce chilometraggio ed integrità strutturale. Un'esperienza di classe superiore che rende l'acquisto memorabile.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs text-neutral-300 font-medium">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> Garanzia Europea 12 Mesi</span>
                  <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-brand" /> Consegna Rapida</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. Recensioni Clienti */}
      <section id="recensioni" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Trust Badge Google */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-neutral-900 pb-12 mb-16 text-left">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-brand">
                COSA DICONO DI NOI
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                LA PAROLA AI NOSTRI UTENTI
              </h2>
            </div>

            {/* Google Badge widget design */}
            <div className="rounded-xl border border-neutral-900 bg-neutral-950 p-5 flex items-center gap-4">
              {/* Google G Logo simulator */}
              <div className="h-10 w-10 bg-neutral-900 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                G
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-sm">{DEMO ? 'Recensioni di esempio' : 'Punteggio Google'}</span>
                  <div className="flex items-center text-brand">
                    <Star className="h-3.5 w-3.5 fill-brand" />
                    <Star className="h-3.5 w-3.5 fill-brand" />
                    <Star className="h-3.5 w-3.5 fill-brand" />
                    <Star className="h-3.5 w-3.5 fill-brand" />
                    <Star className="h-3.5 w-3.5 fill-brand" />
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">{DEMO ? 'Nel sito vero qui compaiono le recensioni Google del salone.' : 'Scopri le recensioni verificate dei nostri clienti.'}</p>
              </div>
            </div>
          </div>

          {/* Recensioni: widget Featurable o Trustindex dal config (src/components/WidgetRecensioni.tsx) */}
          <WidgetRecensioni />

          {/* Demo senza widget: recensioni di esempio, etichettate come tali */}
          {DEMO && !widgetRecensioniAttivo && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} esempio />)}
            </div>
          )}

          {!DEMO && <div className="mt-12 text-center">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${NOME} ${CITTA} recensioni`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 hover:border-brand bg-neutral-950/50 hover:bg-neutral-900 text-neutral-300 hover:text-white px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all"
            >
              Leggi tutte le recensioni su Google
              <ArrowUpRight className="h-4 w-4 text-brand" />
            </a>
          </div>}

        </div>
      </section>

      {/* 8. Dove Siamo / Mappa */}
      <section id="dove-siamo" className="py-24 md:py-32 bg-neutral-950/40 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            
            {/* Map info side */}
            <div className="lg:col-span-5 flex flex-col justify-between text-left space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-brand">
                  VIENI A TROVARCI IN SALONE
                </span>
                <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                  LA NOSTRA SEDE
                </h2>
                <div className="h-1 bg-brand w-12 rounded-full my-4" />
                <p className="text-sm leading-relaxed text-neutral-400 font-normal">
                  Il nostro salone si trova in una posizione strategica a {CITTA}, facilmente raggiungibile e dotato di ampio parcheggio riservato ai clienti. Ti aspettiamo per mostrarti le vetture da vicino.
                </p>
              </div>

              {/* Dynamic Info Cards */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <MapPin className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider">Indirizzo</h4>
                    <p className="text-sm text-neutral-300 mt-0.5">{INDIRIZZO}, {CAP_CITTA}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Clock className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase text-white tracking-wider">Orari di Apertura</h4>
                    <div className="text-xs text-neutral-300 mt-1 space-y-1">
                      {ORARI.map((o) => (
                        <p key={o.etichetta}>
                          <strong className="text-neutral-400">{o.etichettaBreve}:</strong> {fasceTesto(o)}
                          {o.nota && <span className="text-neutral-500 font-medium"> ({o.nota})</span>}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {TEL && (
                  <div className="flex items-start gap-3.5">
                    <Phone className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase text-white tracking-wider">Telefono e Assistenza</h4>
                      <a href={TEL_HREF} className="text-sm text-brand hover:underline font-bold mt-0.5 block">
                        {TEL}
                      </a>
                    </div>
                  </div>
                )}

                {EMAIL && (
                  <div className="flex items-start gap-3.5">
                    <Mail className="h-5 w-5 text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase text-white tracking-wider">Email Ufficiale</h4>
                      <a href={`mailto:${EMAIL}`} className="text-sm text-brand hover:underline font-bold mt-0.5 block">
                        {EMAIL}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action route finder */}
              <div className="pt-4">
                <a
                  href={MAPPA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-brand text-white px-6 py-3 text-xs font-bold tracking-widest uppercase transition-all duration-200"
                >
                  Ottieni Indicazioni Stradali
                  <ArrowUpRight className="h-4 w-4 text-brand" />
                </a>
              </div>
            </div>

            {/* Interactive Embed Map panel */}
            <div className="lg:col-span-7 h-[350px] lg:h-auto min-h-[350px] rounded-xl overflow-hidden border border-neutral-900 bg-neutral-950 relative">
              <iframe
                title={`${RAGIONE} Location Map`}
                src={MAPPA_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(0.9) contrast(1.1) invert(0.9)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>
        </div>
      </section>

      {/* 9. Form Contatti */}
      <section id="contatti-sezione" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <ContactForm cars={cars} selectedCar={inquiryCar} setSelectedCar={setInquiryCar} />
        </div>
      </section>
        </>
      ) : currentPage === 'azienda' ? (
        <Suspense fallback={<PageLoader />}>
          <AziendaPage onNavigateToContacts={() => navigate('/contatti')} />
        </Suspense>
      ) : currentPage === 'usato-garantito' ? (
        <Suspense fallback={<PageLoader />}>
          <UsatoGarantitoPage
            cars={cars}
            onSelectCar={handleSelectCar}
          />
        </Suspense>
      ) : currentPage === 'car-detail' ? (
        carsLoading ? <PageLoader /> :
        <Suspense fallback={<PageLoader />}>
          <CarDetailPage
            cars={cars}
            carId={selectedCarId}
            onBack={() => navigate('/parco-auto')}
            onInquire={(carName) => { setInquiryCar(carName); navigate('/contatti'); }}
            onNavigateToGaranzia={() => navigate('/garanzia')}
          />
        </Suspense>
      ) : currentPage === 'faq' ? (
        <Suspense fallback={<PageLoader />}>
          <FAQPage />
        </Suspense>
      ) : currentPage === 'garanzia' ? (
        <Suspense fallback={<PageLoader />}>
          <GaranziaPage />
        </Suspense>
      ) : currentPage === 'privacy' ? (
        <Suspense fallback={<PageLoader />}>
          <PrivacyPolicyPage />
        </Suspense>
      ) : currentPage === 'termini' ? (
        <Suspense fallback={<PageLoader />}>
          <TerminiUtilizzoPage />
        </Suspense>
      ) : (
        <Suspense fallback={<PageLoader />}>
          <ContattiPage cars={cars} selectedCar={inquiryCar} setSelectedCar={setInquiryCar} />
        </Suspense>
      )}

      {/* 10. Footer */}
      <footer className="bg-black border-t border-neutral-900 py-16 text-left relative z-10 pb-28 md:pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-neutral-900">
            
            {/* Brand Logo Col */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src={logoSrc} 
                  alt="Parco Auto Logo" 
                  className="h-14 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
                {RAGIONE} è la tua concessionaria multimarca di riferimento a {CITTA}. Vendita di auto nuove, usate certificate e servizi di noleggio a lungo e breve termine.
              </p>
            </div>

            {/* Fast Links Col */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Menu Rapido</h4>
              <ul className="text-xs text-neutral-400 space-y-2.5 font-medium flex flex-col items-start">
                <li><button onClick={() => navigate('/parco-auto')} className="hover:text-brand transition-colors text-left cursor-pointer">Vetrina Parco Auto</button></li>
                <li><button onClick={() => navigate('/')} className="hover:text-brand transition-colors text-left cursor-pointer">I Nostri Servizi (Home)</button></li>
                <li><button onClick={() => navigate('/azienda')} className="hover:text-brand transition-colors text-left cursor-pointer">Chi Siamo (Azienda)</button></li>
                <li><button onClick={() => navigate('/faq')} className="hover:text-brand transition-colors text-left cursor-pointer">Domande Frequenti (FAQ)</button></li>
                <li><button onClick={() => navigate('/contatti')} className="hover:text-brand transition-colors text-left cursor-pointer text-brand">Contatti e Dove Siamo</button></li>
              </ul>
            </div>

            {/* Legal / Contact details */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white font-semibold">Sede e Contatti</h4>
              <div className="text-xs text-neutral-400 space-y-2 leading-relaxed">
                <p><strong>{RAGIONE}</strong></p>
                <p>Showroom: {INDIRIZZO}, {CAP_CITTA}</p>
                <p>Sede legale: {SEDE_LEGALE}</p>
                {CELL && (
                  <p>Cellulare: <a href={CELL_HREF} className="text-neutral-300 hover:text-brand">{CELL}</a></p>
                )}
                {EMAIL && (
                  <p>Email: <a href={`mailto:${EMAIL}`} className="text-neutral-300 hover:text-brand">{EMAIL}</a></p>
                )}
                <p>P.IVA / C.F.: {DATI_LEGALI.piva} &middot; REA: {DATI_LEGALI.rea}</p>
                <p>Registro Imprese {DATI_LEGALI.registroImprese} &middot; Capitale sociale {DATI_LEGALI.capitaleSociale}</p>
              </div>
            </div>

          </div>

          {/* Bottom Copyright details */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-600 font-medium">
            <p>© {new Date().getFullYear()} {RAGIONE}. Tutti i diritti riservati.</p>
            <div className="flex gap-4">
              <button onClick={() => navigate('/privacy')} className="hover:text-brand transition-colors cursor-pointer">Privacy e Cookie</button>
              <span>•</span>
              <button onClick={() => navigate('/termini')} className="hover:text-brand transition-colors cursor-pointer">Termini d'Uso</button>
              <span>•</span>
              <button onClick={() => navigate('/garanzia')} className="hover:text-brand transition-colors cursor-pointer">Garanzia</button>
            </div>
          </div>
          <div className="pt-3 text-center text-[10px] text-neutral-700">
            Made with Love & AI by{' '}
            <a
              href="https://studiobrillo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-brand transition-colors"
            >
              Studio Brillo
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA bar */}
      <StickyMobileCTA />
      <CookieBanner visible={bannerCookie} onChoice={sceltaCookie} />
      <DemoBar />
      {DEMO && <div className="h-14 sm:h-10" aria-hidden />}

    </div>
  );
}