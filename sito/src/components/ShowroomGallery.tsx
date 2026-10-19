import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { CITTA, NOME } from '../lib/brand';

// Foto della gallery showroom (src/assets/images/gallery, showroom-01..NN.webp)
const images = Array.from({ length: 8 }, (_, i) =>
  new URL(`../assets/images/gallery/showroom-${String(i + 1).padStart(2, '0')}.webp`, import.meta.url).href
);

export default function ShowroomGallery() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const close = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const next = () => setLightboxIdx((i) => (i === null ? null : (i + 1) % images.length));

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIdx]);

  return (
    <section className="py-16 sm:py-24 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-brand text-xs font-bold uppercase tracking-widest mb-3">
            <Images className="h-4 w-4" />
            Il nostro showroom
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white">
            Uno sguardo dentro {NOME}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {images.map((src, idx) => (
            <button
              key={src}
              onClick={() => setLightboxIdx(idx)}
              className="group relative aspect-4/3 overflow-hidden rounded-lg bg-neutral-900 cursor-pointer"
            >
              <img
                src={src}
                alt={`Showroom ${NOME} ${CITTA}, foto ${idx + 1}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox fullscreen */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 sm:p-8"
            onClick={close}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white p-2 cursor-pointer"
              aria-label="Chiudi"
            >
              <X className="h-7 w-7" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 sm:left-6 text-white/70 hover:text-white p-2 cursor-pointer"
              aria-label="Foto precedente"
            >
              <ChevronLeft className="h-9 w-9" />
            </button>

            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={images[lightboxIdx]}
              alt={`Showroom ${NOME} ${CITTA}, foto ${lightboxIdx + 1}`}
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-full sm:max-w-[85vw] object-contain rounded-lg"
            />

            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 sm:right-6 text-white/70 hover:text-white p-2 cursor-pointer"
              aria-label="Foto successiva"
            >
              <ChevronRight className="h-9 w-9" />
            </button>

            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tracking-wide">
              {lightboxIdx + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
