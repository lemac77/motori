import { motion } from 'motion/react';
import { MapPin, Mail, Phone, Calendar, Clock, Compass } from 'lucide-react';
import { Car } from '../types';
import ContactForm from './ContactForm';
import showroomFrontale from '../assets/images/showroom/showroom-esterno-frontale.webp';
import { ORARI, TEL, TEL_HREF, CELL, EMAIL, WA_HREF, MAPPA_LINK, MAPPA_EMBED, NOME, RAGIONE, CITTA, REGIONE, INDIRIZZO, CAP_CITTA } from '../lib/brand';

interface ContattiPageProps {
  cars: Car[];
  selectedCar: string;
  setSelectedCar: (car: string) => void;
}

export default function ContattiPage({ cars, selectedCar, setSelectedCar }: ContattiPageProps) {
  // Orari dal config: prima fascia = mattina, seconda = pomeriggio
  const openingHours = ORARI.map((o) => ({
    days: o.etichetta,
    morning: o.fasce[0] ? `${o.fasce[0][0]} - ${o.fasce[0][1]}` : 'Chiuso tutto il giorno',
    afternoon: o.fasce[1] ? `${o.fasce[1][0]} - ${o.fasce[1][1]}` : o.fasce[0] ? (o.nota ?? 'Chiuso nel pomeriggio') : '',
  }));

  return (
    <div className="pt-24 pb-16 bg-black text-white min-h-screen">
      {/* Header */}
      <div className="relative border-b border-neutral-900 bg-neutral-950/40 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase font-bold tracking-wider text-brand"
          >
            CONTATTI • {RAGIONE.toUpperCase()}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-white"
          >
            VIENI A TROVARCI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed"
          >
            Siamo a {CITTA}, in {INDIRIZZO}. Un ampio parcheggio riservato ai clienti e un team qualificato ti aspettano in sede.
          </motion.p>
        </div>
      </div>

      {/* Foto reale della sede, per riconoscere subito l'edificio arrivando */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
          <img
            src={showroomFrontale}
            alt={`Facciata ${RAGIONE}, ${INDIRIZZO}, ${CITTA}`}
            referrerPolicy="no-referrer"
            className="w-full h-56 sm:h-72 object-cover"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 space-y-16">
        
        {/* Map & Office Details Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Location & Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-6 space-y-6 backdrop-blur-xs text-left">
              <h2 className="font-display text-lg font-bold text-white uppercase tracking-tight border-b border-neutral-900 pb-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-brand" />
                Dati della Sede
              </h2>

              <div className="space-y-4">
                {/* Physical address */}
                <div className="flex items-start gap-3.5">
                  <div className="h-9 w-9 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="h-4.5 w-4.5 text-brand" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">Sede Principale</span>
                    <p className="text-xs sm:text-sm text-neutral-200">{INDIRIZZO}</p>
                    <p className="text-xs text-neutral-400">{CAP_CITTA} • {REGIONE}</p>
                    <a 
                      href={MAPPA_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-brand hover:underline font-bold uppercase tracking-wider block mt-1"
                    >
                      Ottieni Indicazioni Stradali
                    </a>
                  </div>
                </div>

                {/* Email address */}
                {EMAIL && (
                  <div className="flex items-start gap-3.5">
                    <div className="h-9 w-9 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="h-4.5 w-4.5 text-brand" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">Email Ufficiale</span>
                      <p className="text-xs sm:text-sm text-neutral-200">
                        <a href={`mailto:${EMAIL}`} className="hover:text-brand transition-colors">
                          {EMAIL}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Phone */}
                {(TEL || WA_HREF) && (
                  <div className="flex items-start gap-3.5">
                    <div className="h-9 w-9 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                      <Phone className="h-4.5 w-4.5 text-brand" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">Contatto Diretto</span>
                      {TEL && (
                        <p className="text-xs sm:text-sm text-neutral-200">
                          Telefono Fisso: <a href={TEL_HREF} className="hover:text-brand font-bold transition-colors">{TEL}</a>
                        </p>
                      )}
                      {WA_HREF && (
                        <p className="text-xs text-neutral-400">
                          WhatsApp: <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="hover:text-brand font-bold transition-colors">{CELL}</a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opening specifications */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-6 space-y-4 backdrop-blur-xs text-left">
              <h2 className="font-display text-lg font-bold text-white uppercase tracking-tight border-b border-neutral-900 pb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand" />
                Orari di Apertura
              </h2>

              <div className="space-y-3">
                {openingHours.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-neutral-900/40 last:border-0">
                    <span className="font-semibold text-neutral-300">{h.days}</span>
                    <div className="text-right text-neutral-400 font-mono">
                      <span>{h.morning}</span>
                      {h.afternoon && (
                        <span className="block text-[11px] text-neutral-500">{h.afternoon}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Google Map Simulation & Guide */}
          <div className="lg:col-span-7 h-full">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-5 backdrop-blur-xs space-y-4 text-left flex flex-col h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">La nostra posizione a {CITTA}</h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-900 text-[10px] text-neutral-400 font-semibold">
                  GPS: 45.068019, 11.777017
                </span>
              </div>
              
              {/* Elegant Real Google Map Embedded */}
              <div className="relative rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/30 flex-1 min-h-[350px]">
                <iframe 
                  src={MAPPA_EMBED} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  title={`Mappa ${RAGIONE}`}
                  className="w-full h-full min-h-[350px] rounded-lg opacity-90 brightness-90 filter"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form area */}
        <div className="border-t border-neutral-900 pt-16">
          <div className="text-center space-y-2 mb-12">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand font-mono">MODULO DI CONTATTO</span>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">SCRIVICI O PRENOTA UN APPUNTAMENTO</h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
              Seleziona la tua auto di interesse o richiedi maggiori dettagli sul noleggio e sui finanziamenti. Rispondiamo entro 2 ore.
            </p>
          </div>
          
          <ContactForm cars={cars} selectedCar={selectedCar} setSelectedCar={setSelectedCar} />
        </div>
      </div>
    </div>
  );
}