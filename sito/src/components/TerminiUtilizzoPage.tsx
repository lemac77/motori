import { motion } from 'motion/react';
import { FileText, Info, Copyright, AlertTriangle, Link2, RefreshCw, Gavel, Mail } from 'lucide-react';
import { EMAIL, NOME, RAGIONE, SEDE_LEGALE, DATI_LEGALI, SITO_HOST } from '../lib/brand';

const sections = [
  {
    icon: Info,
    title: '1. Oggetto',
    body: `Il presente sito web (${SITO_HOST}) è di proprietà di ${RAGIONE} e ha finalità informativa e promozionale: presentare il parco auto disponibile, i servizi offerti e i contatti aziendali. La navigazione e l'utilizzo del sito comportano l'accettazione integrale delle presenti condizioni.`,
  },
  {
    icon: FileText,
    title: '2. Natura Informativa dei Contenuti',
    body: `Le informazioni relative ai veicoli in vetrina (prezzo, dotazioni, chilometraggio, immagini) hanno carattere indicativo e vengono aggiornate periodicamente. Non costituiscono un'offerta contrattuale vincolante: i dettagli definitivi di ogni veicolo e le condizioni economiche vengono confermati esclusivamente in sede, al momento della trattativa e della sottoscrizione del contratto di vendita. Eventuali imprecisioni o disallineamenti temporanei tra il sito e lo stato reale del veicolo non vincolano ${RAGIONE}.`,
  },
  {
    icon: Copyright,
    title: '3. Proprietà Intellettuale',
    body: `Testi, immagini, loghi e marchio "${NOME}" presenti sul sito sono di proprietà di ${RAGIONE} o utilizzati con relativa autorizzazione, e sono protetti dalla normativa sul diritto d'autore e sulla proprietà industriale. È vietata la riproduzione, copia o ridistribuzione dei contenuti senza previa autorizzazione scritta.`,
  },
  {
    icon: AlertTriangle,
    title: '4. Limitazione di Responsabilità',
    body: `${RAGIONE} si impegna a mantenere il sito aggiornato e funzionante, ma non garantisce l'assenza di interruzioni, errori tecnici o imprecisioni occasionali nei contenuti. L'uso del sito è a rischio dell'utente; ${RAGIONE} non risponde di eventuali danni derivanti dall'impossibilità di accesso al sito o da informazioni non aggiornate.`,
  },
  {
    icon: Link2,
    title: '5. Link a Siti Terzi',
    body: `Il sito può contenere collegamenti a siti di terze parti (es. Google Maps, piattaforme social). ${RAGIONE} non ha controllo su tali siti e non si assume responsabilità per i loro contenuti o per le rispettive policy sulla privacy.`,
  },
  {
    icon: RefreshCw,
    title: '6. Modifiche ai Termini',
    body: `${RAGIONE} si riserva il diritto di modificare in qualsiasi momento i presenti Termini di Utilizzo, pubblicando la versione aggiornata sul sito.`,
  },
  {
    icon: Gavel,
    title: '7. Legge Applicabile e Foro Competente',
    body: `I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia relativa all'uso del sito è competente il foro del luogo in cui ha sede ${RAGIONE}.`,
  },
];

export default function TerminiUtilizzoPage() {
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
            TERMINI DI UTILIZZO DEL SITO
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none"
          >
            REGOLE CHIARE, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-400">NAVIGAZIONE SICURA.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed"
          >
            Condizioni di utilizzo del sito {SITO_HOST}, di proprietà di {RAGIONE}.
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
          <FileText className="h-6 w-6 text-brand mx-auto" />
          <h4 className="font-display text-xl font-bold text-white uppercase tracking-tight">Hai domande sui termini?</h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Il nostro team è a tua disposizione per qualsiasi chiarimento su queste condizioni di utilizzo.
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
