import { motion } from 'motion/react';
import { ShieldCheck, Database, Target, Scale, Clock, UserCheck, Ban, Mail } from 'lucide-react';
import { EMAIL, NOME, RAGIONE, SEDE_LEGALE, DATI_LEGALI, SITO_HOST } from '../lib/brand';

const sections = [
  {
    icon: Database,
    title: '1. Titolare del Trattamento',
    body: `Il Titolare del trattamento dei dati personali è ${RAGIONE}, con sede legale in ${SEDE_LEGALE}, P.IVA e C.F. ${DATI_LEGALI.piva}, REA ${DATI_LEGALI.rea}. Per qualsiasi richiesta relativa al trattamento dei tuoi dati personali puoi rivolgerti al Titolare presso la sede indicata.`,
  },
  {
    icon: Database,
    title: '2. Quali Dati Raccogliamo',
    body: 'Attraverso i moduli di contatto presenti sul sito raccogliamo esclusivamente i dati che ci fornisci volontariamente: nome e cognome, indirizzo email, numero di telefono e l\'auto o il servizio di tuo interesse. Non raccogliamo categorie particolari di dati (art. 9 GDPR) né effettuiamo profilazione automatizzata.',
  },
  {
    icon: Target,
    title: '3. Finalità del Trattamento',
    body: 'I dati raccolti sono trattati per rispondere alle richieste di informazioni commerciali, gestire la trattativa di vendita, noleggio o permuta di un veicolo, ed eseguire eventuali misure precontrattuali richieste dall\'interessato prima della conclusione di un contratto.',
  },
  {
    icon: Scale,
    title: '4. Base Giuridica',
    body: 'Il trattamento si fonda sul consenso esplicito dell\'interessato, prestato al momento dell\'invio del modulo di contatto, e sull\'esecuzione di misure precontrattuali adottate su richiesta dell\'interessato stesso, ai sensi dell\'art. 6, par. 1, lett. a) e b) del Regolamento UE 2016/679 (GDPR).',
  },
  {
    icon: Clock,
    title: '5. Tempi di Conservazione',
    body: 'I dati personali sono conservati per il tempo necessario a evadere la richiesta e, in caso di avvio di una trattativa commerciale, per la durata della stessa e per il periodo successivo previsto dagli obblighi di legge (es. civilistici, fiscali). Decorsi tali termini, i dati vengono cancellati o resi anonimi.',
  },
  {
    icon: UserCheck,
    title: '6. Diritti dell\'Interessato',
    body: `Ai sensi degli artt. 15-22 del GDPR hai il diritto di richiedere in qualsiasi momento l'accesso ai tuoi dati personali, la rettifica o la cancellazione degli stessi, la limitazione del trattamento, la portabilità dei dati e di opporti al trattamento, oltre al diritto di revocare il consenso in qualunque momento senza pregiudicare la liceità del trattamento basata sul consenso prestato prima della revoca. Per esercitare questi diritti puoi scrivere a il Titolare presso la sede indicata.`,
  },
  {
    icon: Ban,
    title: '7. Comunicazione e Diffusione dei Dati',
    body: `I tuoi dati personali non vengono ceduti, venduti o comunicati a terzi per finalità di marketing. Possono essere condivisi unicamente con soggetti che collaborano con ${RAGIONE} per l'erogazione del servizio richiesto (es. società di finanziamento in caso di richiesta di un preventivo), nei limiti strettamente necessari e nel rispetto della normativa vigente.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-24 pb-16 bg-black text-white min-h-screen">
      {/* Header section */}
      <div className="relative border-b border-neutral-900 bg-neutral-950/40 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] uppercase font-bold tracking-widest text-brand font-mono"
          >
            PRIVACY POLICY • REG. UE 2016/679 (GDPR)
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none"
          >
            I TUOI DATI, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-400">TRATTATI CON CURA.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed"
          >
            Informativa sul trattamento dei dati personali ai sensi del Regolamento UE 2016/679, resa a chi interagisce con i servizi web di {RAGIONE}.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-4">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:p-8 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-md shrink-0">
                  <Icon className="h-4 w-4 text-brand" />
                </span>
                <h3 className="font-display text-sm md:text-base font-bold text-white uppercase tracking-tight">
                  {section.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {section.body}
              </p>
            </motion.div>
          );
        })}

        {/* Contact CTA banner */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 md:p-8 text-center space-y-4">
          <ShieldCheck className="h-6 w-6 text-brand mx-auto" />
          <h4 className="font-display text-xl font-bold text-white uppercase tracking-tight">Vuoi esercitare i tuoi diritti?</h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Scrivici in qualsiasi momento per accedere, rettificare o richiedere la cancellazione dei tuoi dati personali.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold">
            {EMAIL && (
              <span className="text-neutral-300 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand" /> <a href={`mailto:${EMAIL}`} className="text-brand hover:underline">{EMAIL}</a></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
