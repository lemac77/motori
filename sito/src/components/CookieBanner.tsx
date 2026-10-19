import { AnimatePresence, motion } from 'motion/react';
import { Cookie } from 'lucide-react';


interface CookieBannerProps {
  visible: boolean;
  onChoice: (choice: 'accepted' | 'rejected') => void;
}

export default function CookieBanner({ visible, onChoice }: CookieBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 z-50 px-4 pb-4"
        >
          <div className="max-w-3xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur shadow-[0_8px_25px_rgba(0,0,0,0.4)] p-5 md:p-6 flex flex-col md:flex-row items-center gap-4">
            <span className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-md shrink-0">
              <Cookie className="h-4 w-4 text-brand" />
            </span>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed flex-1 text-center md:text-left">
              Usiamo cookie tecnici necessari al funzionamento del sito e, solo con il tuo consenso, cookie analitici (Google Analytics) per capire in forma aggregata come viene usato. Nessun cookie di profilazione pubblicitaria.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onChoice('rejected')}
                className="px-4 py-2 rounded-md text-[11px] font-bold tracking-wider uppercase bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700 transition-all"
              >
                Rifiuta
              </button>
              <button
                onClick={() => onChoice('accepted')}
                className="px-4 py-2 rounded-md text-[11px] font-bold tracking-wider uppercase bg-brand text-white hover:bg-brand/90 transition-all"
              >
                Accetta
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
