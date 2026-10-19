import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Percent } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Valori di default (uguali a quelli comunicati dalla finanziaria), usati finché non arrivano
// quelli reali da Supabase. Configurabili dal pannello, in "Impostazioni", validi per tutte le auto.
const DEFAULT_TAN = 10.45;
const DEFAULT_TAEG_CON_ASSICURAZIONE = 15.95;
const DEFAULT_TAEG_SENZA_ASSICURAZIONE = 16;
const DEFAULT_SPESE_ISTRUTTORIA = 400;
const DEFAULT_SPESE_INCASSO_RATA = 0;
const DEFAULT_INSURANCE_RATIO = 0.2227;

const RATE_OPTIONS = [12, 24, 36, 48, 60, 72, 84, 96];

interface FinancingCalculatorProps {
  carPrice: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export default function FinancingCalculator({ carPrice }: FinancingCalculatorProps) {
  const [expanded, setExpanded] = useState(false);
  const min = Math.min(3000, carPrice);
  const [amount, setAmount] = useState(carPrice);
  const [months, setMonths] = useState(96);
  const [withInsurance, setWithInsurance] = useState(true);

  // Parametri configurati dal pannello (Impostazioni), uguali per tutte le auto
  const [TAN, setTAN] = useState(DEFAULT_TAN);
  const [TAEG_CON_ASSICURAZIONE, setTaegConAssicurazione] = useState(DEFAULT_TAEG_CON_ASSICURAZIONE);
  const [TAEG_SENZA_ASSICURAZIONE, setTaegSenzaAssicurazione] = useState(DEFAULT_TAEG_SENZA_ASSICURAZIONE);
  const [SPESE_ISTRUTTORIA, setSpeseIstruttoria] = useState(DEFAULT_SPESE_ISTRUTTORIA);
  const [SPESE_INCASSO_RATA, setSpeseIncassoRata] = useState(DEFAULT_SPESE_INCASSO_RATA);
  const [INSURANCE_RATIO, setInsuranceRatio] = useState(DEFAULT_INSURANCE_RATIO);

  useEffect(() => {
    supabase
      .from('impostazioni_generali')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.tasso_finanziamento_tan != null) setTAN(data.tasso_finanziamento_tan);
        if (data.taeg_con_assicurazione != null) setTaegConAssicurazione(data.taeg_con_assicurazione);
        if (data.taeg_senza_assicurazione != null) setTaegSenzaAssicurazione(data.taeg_senza_assicurazione);
        if (data.spese_istruttoria != null) setSpeseIstruttoria(data.spese_istruttoria);
        if (data.spese_incasso_rata != null) setSpeseIncassoRata(data.spese_incasso_rata);
        if (data.rapporto_assicurazione != null) setInsuranceRatio(data.rapporto_assicurazione);
      });
  }, []);

  const result = useMemo(() => {
    const monthlyRate = TAN / 100 / 12;
    const insuranceAmount = withInsurance ? amount * INSURANCE_RATIO : 0;
    const rataAuto = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    const rataAssicurazione = withInsurance ? insuranceAmount / months : 0;
    const rata = rataAuto + rataAssicurazione;
    const costoTotaleCredito = rata * months;
    const taeg = withInsurance ? TAEG_CON_ASSICURAZIONE : TAEG_SENZA_ASSICURAZIONE;

    return {
      rata,
      costoTotaleCredito,
      insuranceAmount,
      taeg,
    };
  }, [amount, months, withInsurance, TAN, TAEG_CON_ASSICURAZIONE, TAEG_SENZA_ASSICURAZIONE, INSURANCE_RATIO]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-brand hover:bg-brand/90 transition-colors text-left cursor-pointer"
      >
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/80 block">Rata consigliata</span>
          <span className="font-display text-2xl font-black text-white tracking-tight">{Math.round(result.rata)} €</span>
          <span className="text-[10px] text-white/70 block">T.A.N. {TAN.toString().replace('.', ',')}% - T.A.E.G. {result.taeg.toString().replace('.', ',')}%</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider shrink-0">
          Configura la tua rata
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {expanded && (
        <div className="p-5 sm:p-6 space-y-6 border-t border-neutral-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: configurator */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-semibold uppercase tracking-wider">Quanto vuoi finanziare</span>
                  <span className="text-brand font-bold">{formatCurrency(amount)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={carPrice}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>{formatCurrency(min)}</span>
                  <span>{formatCurrency(carPrice)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider block">Quante rate desideri</span>
                <div className="flex flex-wrap gap-2">
                  {RATE_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonths(m)}
                      className={`h-9 min-w-9 px-2 rounded-lg text-xs font-bold transition-all ${
                        months === m
                          ? 'bg-brand text-white'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-brand" /> Aggiungi l'assicurazione
                </span>
                <p className="text-[11px] text-neutral-500 leading-relaxed">L'importo del premio è finanziato nel prestito. Tutela il tuo rimborso.</p>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                    <input type="radio" checked={withInsurance} onChange={() => setWithInsurance(true)} className="accent-brand" />
                    Sì, sono interessato
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                    <input type="radio" checked={!withInsurance} onChange={() => setWithInsurance(false)} className="accent-brand" />
                    No, non sono interessato
                  </label>
                </div>
              </div>
            </div>

            {/* Right: result */}
            <div className="rounded-xl bg-brand p-5 space-y-4 text-white">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">La tua rata mensile</span>
                <p className="text-[10px] text-white/70">(IVA inclusa)</p>
              </div>
              <div className="rounded-lg border border-white/30 p-4 text-center">
                <p className="font-display text-3xl font-black">{Math.round(result.rata)} €</p>
                <p className="text-xs text-white/80 mt-1">T.A.N. {TAN.toString().replace('.', ',')}% - T.A.E.G. {result.taeg.toString().replace('.', ',')}%</p>
              </div>
              <div className="text-xs text-white/90 space-y-1.5">
                <div className="flex justify-between"><span>Importo finanziato:</span><span className="font-bold">{formatCurrency(amount)}</span></div>
                <div className="flex justify-between"><span>Costo totale del credito:</span><span className="font-bold">{formatCurrency(result.costoTotaleCredito)}</span></div>
                <div className="flex justify-between"><span>Spese di incasso rata:</span><span className="font-bold">{formatCurrency(SPESE_INCASSO_RATA)}</span></div>
                <div className="flex justify-between"><span>Spese istruttoria:</span><span className="font-bold">{formatCurrency(SPESE_ISTRUTTORIA)}</span></div>
                {withInsurance && (
                  <div className="flex justify-between"><span>Spese assicurative:</span><span className="font-bold">{formatCurrency(result.insuranceAmount)}</span></div>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-neutral-500 leading-relaxed border-t border-neutral-900 pt-4">
            Messaggio pubblicitario con finalità promozionale. I valori sono indicativi e calcolati in proporzione all'importo selezionato. La rata finanziaria è comprensiva di spese RID. Salvo approvazione dell'istituto di credito erogante. Al fine di gestire le tue spese in modo responsabile e di conoscere eventuali altre offerte disponibili, l'Istituto di Credito erogante ti ricorda, prima di sottoscrivere il contratto, di prendere visione di tutte le condizioni economiche e contrattuali, facendo riferimento alle Informazioni Europee di Base sul Credito ai Consumatori presso il punto vendita.
          </p>
        </div>
      )}
    </div>
  );
}
