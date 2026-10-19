import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Info } from 'lucide-react';
import { Car } from '../types';
import CarCard from './CarCard';
import { CITTA } from '../lib/brand';

interface UsatoGarantitoPageProps {
  cars: Car[];
  onSelectCar: (carId: string) => void;
}

export default function UsatoGarantitoPage({ cars, onSelectCar }: UsatoGarantitoPageProps) {
  const [search, setSearch] = useState('');
  const [selectedFuel, setSelectedFuel] = useState<string>('Tutti');
  const [selectedGearbox, setSelectedGearbox] = useState<string>('Tutti');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(40000);

  // Clean filters
  const resetFilters = () => {
    setSearch('');
    setSelectedFuel('Tutti');
    setSelectedGearbox('Tutti');
    setSortBy('featured');
    setMaxPrice(40000);
  };

  // Fuel types list
  const fuelTypes = ['Tutti', 'Benzina', 'Diesel', 'Ibrida', 'Elettrica', 'GPL'];
  const gearboxes = ['Tutti', 'Manuale', 'Automatico'];

  // Filter & Sort Logic
  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Filter by search string
    if (search.trim() !== '') {
      const term = search.toLowerCase();
      result = result.filter(
        (car) =>
          car.brand.toLowerCase().includes(term) ||
          car.model.toLowerCase().includes(term)
      );
    }

    // Filter by fuel
    if (selectedFuel !== 'Tutti') {
      result = result.filter((car) => car.fuelType === selectedFuel);
    }

    // Filter by gearbox
    if (selectedGearbox !== 'Tutti') {
      result = result.filter((car) => car.gearbox === selectedGearbox);
    }

    // Filter by max price
    result = result.filter((car) => car.price <= maxPrice);

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'year-desc') {
      result.sort((a, b) => b.year - a.year);
    } else if (sortBy === 'km-asc') {
      result.sort((a, b) => a.km - b.km);
    } else {
      // Featured or default
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [cars, search, selectedFuel, selectedGearbox, sortBy, maxPrice]);

  return (
    <div className="pt-24 pb-16 bg-black text-white min-h-screen">
      {/* Header section with gradient background accent */}
      <div className="relative border-b border-neutral-900 bg-neutral-950/40 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase font-bold tracking-wider text-brand"
          >
            PARCO AUTO A {CITTA.toUpperCase()} • VEICOLI SELEZIONATI
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-white"
          >
            PARCO AUTO
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed"
          >
            Selezioniamo esclusivamente veicoli d'eccellenza con storico di manutenzione verificato e chilometraggio certificato.
            Ogni auto supera oltre 110 rigorosi test tecnici e viene consegnata con 12 mesi di garanzia inclusa e coperture totali.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-5 space-y-6 backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-brand" />
                <h2 className="text-xs uppercase font-bold tracking-wider">Filtri di Ricerca</h2>
              </div>
              <button
                onClick={resetFilters}
                className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 hover:text-brand transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider text-neutral-400">Cerca Modello</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Es. Giulia, Compass..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>

            {/* Fuel Type Filter */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider text-neutral-400">Alimentazione</label>
              <div className="flex flex-wrap gap-1.5">
                {fuelTypes.map((fuel) => (
                  <button
                    key={fuel}
                    onClick={() => setSelectedFuel(fuel)}
                    className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${
                      selectedFuel === fuel
                        ? 'bg-brand text-white'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {fuel}
                  </button>
                ))}
              </div>
            </div>

            {/* Gearbox Filter */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider text-neutral-400">Cambio</label>
              <div className="flex flex-wrap gap-1.5">
                {gearboxes.map((gear) => (
                  <button
                    key={gear}
                    onClick={() => setSelectedGearbox(gear)}
                    className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${
                      selectedGearbox === gear
                        ? 'bg-brand text-white'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {gear}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase font-bold tracking-wider text-neutral-400">
                <span>Prezzo Massimo</span>
                <span className="text-brand font-bold">
                  {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="15000"
                max="40000"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand h-1 bg-neutral-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                <span>15.000 €</span>
                <span>40.000 €+</span>
              </div>
            </div>

            {/* Info notice about Certification */}
            <div className="rounded-lg border border-neutral-900 bg-neutral-950 p-3.5 space-y-2 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <div className="text-[10px] text-neutral-400 leading-normal">
                <span className="font-semibold text-white block uppercase mb-1">Qualità Garantita</span>
                Tutte le vetture sono sottoposte a 110 rigidi controlli in officina. Certificato di chilometraggio incluso.
              </div>
            </div>
          </div>
        </div>

        {/* Cars Showcase Grid */}
        <div className="lg:col-span-9 space-y-6">
          {/* Top Sort Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-neutral-800 bg-neutral-950/80 p-4 rounded-xl">
            <div className="text-xs text-neutral-400">
              Trovati <strong className="text-white">{filteredCars.length}</strong> veicoli corrispondenti
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg text-xs py-1.5 px-3 text-neutral-300 focus:outline-none focus:border-brand cursor-pointer w-full sm:w-auto"
              >
                <option value="featured">In Evidenza</option>
                <option value="price-asc">Prezzo: dal più basso</option>
                <option value="price-desc">Prezzo: dal più alto</option>
                <option value="year-desc">Anno: più recenti</option>
                <option value="km-asc">Chilometri: meno percorsi</option>
              </select>
            </div>
          </div>

          {/* Cars Grid */}
          {filteredCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} onSelect={onSelectCar} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-neutral-800 rounded-2xl p-16 text-center max-w-lg mx-auto space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                <X className="h-5 w-5 text-neutral-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight">Nessun veicolo trovato</h3>
              <p className="text-neutral-400 text-xs">
                Nessuna auto corrisponde ai filtri selezionati. Prova a modificare i criteri di ricerca o resetta i filtri.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex bg-brand hover:bg-brand/90 text-white font-bold text-xs px-4 py-2 rounded-lg uppercase tracking-wider transition-colors"
              >
                Mostra tutte le auto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}