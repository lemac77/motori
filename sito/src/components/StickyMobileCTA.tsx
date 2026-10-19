import { Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { TEL, TEL_HREF, WA_HREF, waLink } from '../lib/brand';

export default function StickyMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  // Show the sticky bar only after scrolling past the Hero section (e.g., 300px)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Nessun contatto rapido configurato (es. demo): niente barra
  if (!TEL && !WA_HREF) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3 bg-black/95 border-t border-neutral-800/80 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
        >
          <div className="grid grid-cols-2 gap-2.5">
            {/* Phone CTA */}
            {TEL && (
              <a
                href={TEL_HREF}
                id="sticky-mobile-call"
                className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white font-bold py-3 text-xs tracking-wider uppercase active:bg-neutral-800 transition-colors"
              >
                <Phone className="h-4 w-4 text-brand" />
                Chiama Ora
              </a>
            )}

            {/* WhatsApp CTA */}
            {WA_HREF && (
              <a
                href={waLink('Salve, ho visto la vostra landing page e vorrei maggiori informazioni.')}
                target="_blank"
                rel="noopener noreferrer"
                id="sticky-mobile-whatsapp"
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white font-bold py-3 text-xs tracking-wider uppercase active:bg-emerald-700 transition-colors shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
