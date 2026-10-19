import { motion } from 'motion/react';
import { ShieldCheck, ClipboardCheck, FileText, RotateCcw, Lock, Phone } from 'lucide-react';
import { TEL, TEL_HREF, NOME } from '../lib/brand';

export default function GaranziaPage() {
  return (
    <div className="pt-24 pb-16 bg-black text-white min-h-screen">
      {/* Header section */}
      <div className="relative border-b border-neutral-900 bg-neutral-950/40 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand font-mono">
            TRASPARENZA • GARANZIA • CONDIZIONI DI VENDITA
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none">
            GARANZIA E <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-blue-400">TERMINI.</span>
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Le condizioni con cui vendiamo ogni veicolo: cosa copre la garanzia legale, come valutiamo lo stato d'uso
            di ogni auto e quali sono i tuoi diritti come acquirente.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-6">

        {/* Garanzia legale di conformità */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:p-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-brand shrink-0" />
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">Garanzia Legale di Conformità</h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Ogni veicolo venduto da {NOME} è coperto dalla Garanzia Legale di Conformità prevista dal Codice del
            Consumo (D.Lgs. 206/2005), della durata di 12 mesi dalla data di ritiro. In caso di difetto di conformità
            non evidente né dichiarato al momento dell'acquisto, hai diritto al ripristino della conformità del bene
            senza spese a tuo carico. Eventuali difetti derivanti dal normale utilizzo, dall'usura o dal chilometraggio
            pregresso del veicolo, e già indicati nello stato d'uso al momento della vendita, non rientrano nella garanzia.
          </p>
        </div>

        {/* Come valutiamo ogni veicolo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="h-5 w-5 text-brand shrink-0" />
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">Come Valutiamo Ogni Veicolo</h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Prima della vendita, ogni auto viene sottoposta a un controllo tecnico che verifica motore, cambio,
            frizione, impianto frenante, sospensioni, impianto elettrico e carrozzeria. Il risultato di ogni verifica
            viene classificato in tre livelli, che condividiamo con te in modo trasparente prima dell'acquisto:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">A</span>
              <p className="text-xs font-bold text-neutral-200">Conforme</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Organo o componente conforme a quanto descritto, nessun intervento necessario.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-brand text-xs font-bold">B</span>
              <p className="text-xs font-bold text-neutral-200">Conforme con usura</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Conforme rispetto alla vetustà e al chilometraggio del veicolo, come indicato nel prezzo.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-1.5">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">C</span>
              <p className="text-xs font-bold text-neutral-200">Da ripristinare</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Difetto rilevato e dichiarato, da sistemare prima della consegna o concordato col cliente.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed pt-1">
            Il dettaglio di questa valutazione è riportato nel Certificato di Conformità che ti consegniamo al
            momento dell'acquisto, insieme al libretto della Garanzia Legale di Conformità.
          </p>
        </div>

        {/* Condizioni di acquisto */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:p-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-brand shrink-0" />
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">Condizioni di Acquisto</h2>
          </div>
          <ul className="text-xs sm:text-sm text-neutral-400 leading-relaxed space-y-2.5 list-none">
            <li className="flex gap-2.5">
              <span className="text-brand font-bold shrink-0">•</span>
              Il prezzo concordato, salvo diversa indicazione, si intende comprensivo di IVA.
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand font-bold shrink-0">•</span>
              La consegna del veicolo avviene presso la nostra sede, nei tempi concordati al momento dell'ordine.
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand font-bold shrink-0">•</span>
              Disponi di 30 giorni dal ritiro del veicolo per segnalarci eventuali vizi occulti non dichiarati al
              momento della vendita.
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand font-bold shrink-0">•</span>
              In caso di acquisto con finanziamento o leasing, la consegna resta subordinata all'approvazione
              dell'istituto finanziario.
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand font-bold shrink-0">•</span>
              Valutiamo il tuo usato in permuta con perizia trasparente, comunicandoti il valore prima della
              conclusione dell'acquisto.
            </li>
          </ul>
        </div>

        {/* Diritto di recesso */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:p-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="h-5 w-5 text-brand shrink-0" />
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">Diritto di Recesso</h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Se l'acquisto viene concluso fuori dai nostri locali (ad esempio a domicilio o in occasione di un evento),
            hai diritto di recedere dal contratto entro 14 giorni dalla sottoscrizione, tramite comunicazione scritta,
            anche a mezzo lettera raccomandata, senza necessità di motivazione.
          </p>
        </div>

        {/* Privacy */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 md:p-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-brand shrink-0" />
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white">Trattamento dei Dati Personali</h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            I dati personali raccolti in fase di trattativa e vendita vengono trattati nel rispetto del Regolamento
            UE 2016/679 (GDPR), esclusivamente per le finalità connesse alla vendita, all'assistenza post-vendita e
            agli obblighi di legge, con l'adozione delle misure tecniche e organizzative adeguate a proteggerli da
            accessi non autorizzati o utilizzi non conformi.
          </p>
        </div>

        {/* Contact CTA banner */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 md:p-8 text-center space-y-4">
          <h4 className="font-display text-xl font-bold text-white uppercase tracking-tight">Hai dubbi su un contratto o una garanzia?</h4>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Prima di ogni acquisto ti spieghiamo di persona ogni clausola, senza fretta. Passa in sede quando vuoi.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold">
            {TEL && (
              <span className="text-neutral-300 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-brand" />
                <a href={TEL_HREF} className="text-brand hover:underline">{TEL}</a>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
