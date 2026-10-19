import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2 } from 'lucide-react';
import { inviaRichiesta } from '../lib/richieste';

interface TestDriveSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  provincia: string;
  carLabel: string;
  dataDesiderata: string;
  fasciaOraria: string;
  message: string;
  date: string;
}

const FASCE_ORARIE = ['08:30 - 10:30', '10:30 - 12:30', '14:30 - 16:30', '16:30 - 18:30'];

interface TestDriveFormProps {
  carLabel: string;
}

export default function TestDriveForm({ carLabel }: TestDriveFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [provincia, setProvincia] = useState('');
  const [dataDesiderata, setDataDesiderata] = useState('');
  const [fasciaOraria, setFasciaOraria] = useState('');
  const [message, setMessage] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<TestDriveSubmission | null>(null);
  const [erroreInvio, setErroreInvio] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !dataDesiderata || !fasciaOraria || !privacyAccepted) return;

    setIsSubmitting(true);
    setErroreInvio(false);

    const newSubmission: TestDriveSubmission = {
      id: 'testdrive-' + Date.now(),
      name,
      email,
      phone,
      provincia,
      carLabel,
      dataDesiderata,
      fasciaOraria,
      message: message || `Richiesta test drive per ${carLabel}`,
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };

    try {
      await inviaRichiesta({
        tipo: 'test_drive',
        nome: name,
        email,
        telefono: phone,
        dati: { provincia, auto: carLabel, dataDesiderata, fasciaOraria, messaggio: message },
      });
      setSubmitted(newSubmission);
    } catch (err) {
      console.error(err);
      setErroreInvio(true);
    }
    setIsSubmitting(false);
  };

  const inputClass = "rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all w-full";
  const labelClass = "text-xs font-semibold text-neutral-300 uppercase tracking-wider";

  return (
    <AnimatePresence mode="wait">
      {!submitted ? (
        <motion.form
          key="testdrive-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-5"
        >
          <div className="text-left mb-2">
            <h4 className="font-display text-xl font-bold text-white">Vuoi richiedere un Test Drive?</h4>
            <p className="text-xs text-neutral-400 mt-1">Prenota una prova su strada per {carLabel}: ti confermiamo appuntamento entro 2 ore lavorative.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Nome e Cognome *</label><input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Email *</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Telefono *</label><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Provincia</label><input value={provincia} onChange={(e) => setProvincia(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Data Desiderata *</label><input type="date" required value={dataDesiderata} onChange={(e) => setDataDesiderata(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Fascia Oraria Desiderata *</label>
              <select required value={fasciaOraria} onChange={(e) => setFasciaOraria(e.target.value)} className={inputClass}>
                <option value="">-- Seleziona --</option>
                {FASCE_ORARIE.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Messaggio</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass + " resize-none"} />
          </div>

          <label className="flex items-start gap-2 text-xs text-neutral-400 cursor-pointer">
            <input type="checkbox" required checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-0.5 accent-brand" />
            Ho letto e accetto <span className="text-brand">l'informativa privacy</span> *
          </label>

          {erroreInvio && (
            <p className="text-xs text-red-400">
              Invio non riuscito, riprova o chiamaci direttamente. Se il problema persiste contattaci telefonicamente.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand hover:bg-brand-hover text-white py-3.5 text-xs tracking-widest font-bold uppercase transition-all duration-200 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Invio in corso...' : 'Prenota Test Drive'}
            <Send className="h-4 w-4" />
          </button>
        </motion.form>
      ) : (
        <motion.div
          key="testdrive-success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center py-8 px-4 flex flex-col items-center"
        >
          <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20 mb-6 text-brand">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="font-display text-2xl font-black text-white tracking-tight">TEST DRIVE RICHIESTO!</h4>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-3 leading-relaxed">
            Gentile <strong className="text-white">{submitted.name}</strong>, abbiamo ricevuto la tua richiesta per il {submitted.dataDesiderata} ({submitted.fasciaOraria}). Ti confermeremo l'appuntamento a breve.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
