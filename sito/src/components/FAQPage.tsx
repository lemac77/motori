import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, HelpCircle, Shield, CreditCard, Car, RefreshCw, Sparkles } from 'lucide-react';
import { faqData } from '../data';
import { FAQItem } from '../types';
import { TEL, TEL_HREF, EMAIL, NOME, CITTA } from '../lib/brand';

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1'); // Open first by default

  const categories = ['Tutte', 'Acquisto', 'Garanzia', 'Finanziamenti', 'Noleggio', 'Permuta'];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Acquisto':
        return <Car className="h-4 w-4 text-brand" />;
      case 'Garanzia':
        return <Shield className="h-4 w-4 text-brand" />;
      case 'Finanziamenti':
        return <CreditCard className="h-4 w-4 text-brand" />;
      case 'Permuta':
        return <RefreshCw className="h-4 w-4 text-brand" />;
      case 'Noleggio':
        return <Sparkles className="h-4 w-4 text-brand" />;
      default:
        return <HelpCircle className="h-4 w-4 text-brand" />;
    }
  };

  const filteredFaqs = useMemo(() => {
    let result = [...faqData];

    if (selectedCategory !== 'Tutte') {
      result = result.filter(faq => faq.category === selectedCategory);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        faq =>
          faq.question.toLowerCase().includes(term) ||
          faq.answer.toLowerCase().includes(term)
      );
    }

    return result;
  }, [searchTerm, selectedCategory]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

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
            DOMANDE FREQUENTI • SUPPORTO E TRASPARENZA
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none"
          >
            RISPOSTE <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-400">CHIARE.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed"
          >
            Tutto ciò che c'è da sapere sull'acquisto, le garanzie, i finanziamenti personalizzati da 30 a 80 rate e il noleggio della tua prossima vettura a {CITTA}.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-8">
        {/* Search & Categories controls */}
        <div className="flex flex-col gap-4 border border-neutral-800 bg-neutral-950/80 p-4 rounded-xl">
          {/* Search bar, sopra e a piena larghezza */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Cerca domanda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* Categorie, sotto, libere di andare a capo in modo pulito */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-brand text-white'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                {cat !== 'Tutte' && getCategoryIcon(cat)}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs Accordion list */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openFaqId === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-brand/40 bg-neutral-950 shadow-[0_8px_25px_rgba(0,71,255,0.08)]'
                      : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                  }`}
                >
                  {/* Trigger Header */}
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-md shrink-0">
                        {getCategoryIcon(faq.category)}
                      </span>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 font-mono block">
                          {faq.category}
                        </span>
                        <h3 className="font-display text-sm md:text-base font-bold text-white uppercase tracking-tight">
                          {faq.question}
                        </h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-neutral-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180 text-brand' : ''
                      }`}
                    />
                  </button>

                  {/* Body Answer */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="border-t border-neutral-900 bg-neutral-950/80"
                      >
                        <div className="px-6 py-5 text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12 text-neutral-500 text-xs sm:text-sm">
              Nessuna risposta trovata per i criteri impostati. Prova un termine diverso.
            </div>
          )}
        </div>

        {/* Contact CTA banner */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 md:p-8 text-center space-y-4">
          <h4 className="font-display text-xl font-bold text-white uppercase tracking-tight">Hai altre domande?</h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Il nostro team di consulenti esperti è sempre a tua disposizione per chiarire qualsiasi dubbio e consigliarti la formula d'acquisto ottimale.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold">
            {TEL && (
              <span className="text-neutral-300">Chiamaci: <a href={TEL_HREF} className="text-brand hover:underline">{TEL}</a></span>
            )}
            {TEL && EMAIL && <span className="hidden sm:inline text-neutral-500">•</span>}
            {EMAIL && (
              <span className="text-neutral-300">Scrivici a: <a href={`mailto:${EMAIL}`} className="text-brand hover:underline">{EMAIL}</a></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
