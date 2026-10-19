import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, ContactSubmission } from '../types';
import { inviaRichiesta } from '../lib/richieste';
import { TEL, TEL_HREF, CELL, EMAIL, WA_HREF, waLink, NOME, CITTA } from '../lib/brand';

interface ContactFormProps {
  cars: Car[];
  selectedCar: string;
  setSelectedCar: (car: string) => void;
  locked?: boolean;
}

export default function ContactForm({ cars, selectedCar, setSelectedCar, locked = false }: ContactFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<ContactSubmission | null>(null);
  const [erroreInvio, setErroreInvio] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    setErroreInvio(false);

    const newSubmission: ContactSubmission = {
      id: 'sub-' + Date.now(),
      name,
      phone,
      carInterest: selectedCar || 'Richiesta generica',
      message: message || 'Nessun messaggio aggiuntivo',
      date: new Date().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    try {
      await inviaRichiesta({
        tipo: 'contatto',
        nome: name,
        telefono: phone,
        dati: { auto_interesse: selectedCar || 'Richiesta generica', messaggio: message },
      });
      setSubmittedData(newSubmission);
      setName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setErroreInvio(true);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Contact info side */}
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-brand">
            Contatti immediati
          </span>
          <h3 className="font-display text-3xl font-bold text-white tracking-tight leading-tight">
            PREFERISCI UN CONTATTO DIRETTO?
          </h3>
          <p className="text-sm leading-relaxed text-neutral-400 font-normal">
            Il nostro team è pronto a risponderti in tempo reale. Siamo a completa disposizione per fissare un appuntamento, elaborare preventivi o pianificare una prova su strada senza pressioni commerciali.
          </p>

          <div className="pt-4 space-y-4">
            {/* Phone button call */}
            {TEL && (
              <a
                href={TEL_HREF}
                id="contact-call-btn"
                className="flex items-center gap-4 p-5 rounded-xl border border-neutral-900 bg-neutral-950/60 hover:border-brand/30 hover:bg-neutral-950 transition-all duration-300 group text-left"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-brand group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-colors duration-300 shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Chiamaci ora</p>
                  <p className="font-display text-lg font-bold text-white group-hover:text-brand transition-colors duration-300">{TEL}</p>
                </div>
              </a>
            )}

            {/* WhatsApp button */}
            {WA_HREF && (
              <a
                href={waLink('Salve, ho visto la vostra landing page e vorrei maggiori informazioni.')}
                target="_blank"
                rel="noopener noreferrer"
                id="contact-whatsapp-btn"
                className="flex items-center gap-4 p-5 rounded-xl border border-neutral-900 bg-neutral-950/60 hover:border-emerald-500/30 hover:bg-neutral-950 transition-all duration-300 group text-left"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-colors duration-300 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Invia WhatsApp</p>
                  <p className="font-display text-base font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">WhatsApp {CELL ?? ''}</p>
                </div>
              </a>
            )}

            {/* Email button */}
            {EMAIL && (
              <a
                href={`mailto:${EMAIL}`}
                id="contact-email-btn"
                className="flex items-center gap-4 p-5 rounded-xl border border-neutral-900 bg-neutral-950/60 hover:border-brand/30 hover:bg-neutral-950 transition-all duration-300 group text-left"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-brand group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-colors duration-300 shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Scrivici via Email</p>
                  <p className="font-display text-base font-bold text-white group-hover:text-brand transition-colors duration-300">{EMAIL}</p>
                </div>
              </a>
            )}

            {/* Visit card */}
            <div
              className="flex items-center gap-4 p-5 rounded-xl border border-neutral-900 bg-neutral-950/60 transition-all duration-300 text-left"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-brand shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">In Sede</p>
                <p className="text-xs text-neutral-300">Riceviamo preferibilmente su appuntamento per garantirti la massima attenzione.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-900/50 bg-neutral-950/20 p-5 text-xs text-neutral-500 space-y-2">
            <p className="font-semibold text-neutral-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-brand" />
              Informativa Trasparenza {NOME}:
            </p>
            <p className="leading-relaxed">
              Tutte le auto in vetrina includono chilometraggio certificato in fattura e garanzia di conformità di 12 mesi. Nessun vincolo finanziario obbligatorio per l'acquisto.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="lg:col-span-7">
          <motion.div
            id="form-card-container"
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <AnimatePresence mode="wait">
              {!submittedData ? (
                <motion.form
                  key="contact-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="text-left mb-6">
                    <h4 className="font-display text-xl font-bold text-white">
                      Richiedi Preventivo o Appuntamento
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Compila il modulo e sarai ricontattato entro 2 ore lavorative.
                    </p>
                  </div>

                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name-input" className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Nome e Cognome *
                    </label>
                    <input
                      type="text"
                      id="name-input"
                      required
                      placeholder="Esempio: Mario Rossi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone-input" className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Numero di Telefono *
                    </label>
                    <input
                      type="tel"
                      id="phone-input"
                      required
                      placeholder="Esempio: 340 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                    />
                  </div>

                  {/* Car of Interest */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="car-select" className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Auto di tuo interesse
                    </label>

                    {locked ? (
                      // Arrivando dalla scheda di un'auto specifica il campo è già determinato,
                      // niente senso farlo scegliere di nuovo: mostriamo un valore fisso non modificabile.
                      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-3 text-sm text-neutral-300">
                        {selectedCar}
                      </div>
                    ) : (
                      // Con decine/centinaia di annunci un <select> nativo diventa scomodo da scorrere:
                      // campo di ricerca con autocomplete al posto del menu a tendina infinito.
                      <>
                        <input
                          id="car-select"
                          list="car-options"
                          type="text"
                          placeholder="Scrivi marca o modello, o lascia vuoto per una richiesta generica"
                          value={selectedCar}
                          onChange={(e) => setSelectedCar(e.target.value)}
                          className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                        />
                        <datalist id="car-options">
                          <option value="Richiesta Generica" />
                          <option value="Noleggio Automezzo" />
                          {cars.map((car) => (
                            <option
                              key={car.id}
                              value={`${car.brand} ${car.model}`}
                              label={`${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(car.price)}`}
                            />
                          ))}
                        </datalist>
                      </>
                    )}
                  </div>

                  {/* Message field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="message-input" className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Messaggio o richieste particolari
                    </label>
                    <textarea
                      id="message-input"
                      rows={3}
                      placeholder="Scrivi qui se hai permute da proporre, orari preferiti per la chiamata, ecc."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  {erroreInvio && (
                    <p className="text-xs text-red-400">
                      Invio non riuscito, riprova o chiamaci direttamente. Se il problema persiste contattaci telefonicamente.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    id="submit-form-btn"
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white py-3.5 text-xs tracking-widest font-bold uppercase transition-all duration-200 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta'}
                    <Send className="h-4 w-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8 px-4 flex flex-col items-center"
                >
                  <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20 mb-6 text-brand">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  
                  <h4 className="font-display text-2xl font-black text-white tracking-tight">
                    GRAZIE, RICHIESTA INVIATA!
                  </h4>
                  
                  <p className="text-sm text-neutral-400 max-w-md mx-auto mt-3 leading-relaxed">
                    Gentile <strong className="text-white">{submittedData.name}</strong>, abbiamo ricevuto la tua richiesta per <strong className="text-brand">{submittedData.carInterest}</strong>.
                  </p>
                  
                  <div className="mt-6 p-4 rounded-xl border border-neutral-900 bg-neutral-900/30 text-left text-xs text-neutral-400 space-y-1.5 w-full max-w-sm">
                    <p><strong className="text-neutral-300">Riferimento:</strong> {submittedData.id}</p>
                    <p><strong className="text-neutral-300">Telefono:</strong> {submittedData.phone}</p>
                    <p><strong className="text-neutral-300">Data/Ora:</strong> {submittedData.date}</p>
                  </div>

                  <p className="text-xs text-neutral-500 mt-6 leading-relaxed">
                    Un nostro consulente di {CITTA} ti risponderà sul numero fornito entro brevissimo tempo.
                  </p>

                  <button
                    onClick={() => setSubmittedData(null)}
                    className="mt-8 border border-neutral-800 hover:border-brand bg-neutral-900 hover:bg-brand hover:text-white transition-all text-neutral-400 font-bold tracking-wider text-[10px] uppercase px-5 py-2 rounded-lg"
                  >
                    Invia un altro messaggio
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}