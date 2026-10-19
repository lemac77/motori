import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2 } from 'lucide-react';
import { inviaRichiesta } from '../lib/richieste';

interface PermutaSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  provincia: string;
  marcaModello: string;
  dataImmatricolazione: string;
  km: string;
  cilindrata: string;
  alimentazione: string;
  targa: string;
  colore: string;
  valoreRichiesto: string;
  note: string;
  date: string;
}

interface PermutaFormProps {
  carLabel: string;
}

export default function PermutaForm({ carLabel }: PermutaFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [provincia, setProvincia] = useState('');
  const [marcaModello, setMarcaModello] = useState('');
  const [dataImmatricolazione, setDataImmatricolazione] = useState('');
  const [km, setKm] = useState('');
  const [cilindrata, setCilindrata] = useState('');
  const [alimentazione, setAlimentazione] = useState('');
  const [targa, setTarga] = useState('');
  const [colore, setColore] = useState('');
  const [valoreRichiesto, setValoreRichiesto] = useState('');
  const [note, setNote] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<PermutaSubmission | null>(null);
  const [erroreInvio, setErroreInvio] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !marcaModello || !dataImmatricolazione || !km || !cilindrata || !alimentazione || !valoreRichiesto || !privacyAccepted) return;

    setIsSubmitting(true);
    setErroreInvio(false);

    const newSubmission: PermutaSubmission = {
      id: 'permuta-' + Date.now(),
      name,
      email,
      phone,
      provincia,
      marcaModello,
      dataImmatricolazione,
      km,
      cilindrata,
      alimentazione,
      targa,
      colore,
      valoreRichiesto,
      note: note || `Interesse per permuta su ${carLabel}`,
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };

    try {
      await inviaRichiesta({
        tipo: 'permuta',
        nome: name,
        email,
        telefono: phone,
        dati: {
          provincia,
          auto_interesse: carLabel,
          marcaModello,
          dataImmatricolazione,
          km,
          cilindrata,
          alimentazione,
          targa,
          colore,
          valoreRichiesto,
          note,
        },
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
          key="permuta-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-5"
        >
          <div className="text-left mb-2">
            <h4 className="font-display text-xl font-bold text-white">Richiedi una Valutazione Permuta</h4>
            <p className="text-xs text-neutral-400 mt-1">Compila il modulo per ricevere una valutazione gratuita del tuo usato, da scalare sul prezzo di {carLabel}.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Nome e Cognome *</label><input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Email *</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Telefono *</label><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Provincia</label><input value={provincia} onChange={(e) => setProvincia(e.target.value)} className={inputClass} /></div>
          </div>

          <h5 className="text-xs font-bold text-white uppercase tracking-wider pt-2 border-t border-neutral-900">Veicolo da valutare</h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Marca e Modello *</label><input required value={marcaModello} onChange={(e) => setMarcaModello(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Data di Immatricolazione *</label><input type="month" required value={dataImmatricolazione} onChange={(e) => setDataImmatricolazione(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Chilometraggio *</label><input type="number" required value={km} onChange={(e) => setKm(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Cilindrata *</label><input required value={cilindrata} onChange={(e) => setCilindrata(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Alimentazione *</label>
              <select required value={alimentazione} onChange={(e) => setAlimentazione(e.target.value)} className={inputClass}>
                <option value="">-- Seleziona --</option>
                <option value="Benzina">Benzina</option>
                <option value="Diesel">Diesel</option>
                <option value="Ibrida">Ibrida</option>
                <option value="Elettrica">Elettrica</option>
                <option value="GPL">GPL</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Targa</label><input value={targa} onChange={(e) => setTarga(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Colore</label><input value={colore} onChange={(e) => setColore(e.target.value)} className={inputClass} /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Quanto vorresti realizzare *</label><input required value={valoreRichiesto} onChange={(e) => setValoreRichiesto(e.target.value)} placeholder="Es. 8.000 €" className={inputClass} /></div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Altre informazioni</label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass + " resize-none"} />
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
            {isSubmitting ? 'Invio in corso...' : 'Richiedi Valutazione'}
            <Send className="h-4 w-4" />
          </button>
        </motion.form>
      ) : (
        <motion.div
          key="permuta-success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center py-8 px-4 flex flex-col items-center"
        >
          <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20 mb-6 text-brand">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h4 className="font-display text-2xl font-black text-white tracking-tight">RICHIESTA DI VALUTAZIONE INVIATA!</h4>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-3 leading-relaxed">
            Gentile <strong className="text-white">{submitted.name}</strong>, un nostro consulente valuterà la tua {submitted.marcaModello} e ti ricontatterà entro 2 ore lavorative.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
