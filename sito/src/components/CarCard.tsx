import { Car } from '../types';
import { Calendar, Gauge, Shield, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface CarCardProps {
  car: Car;
  onSelect: (carId: string) => void;
}

export default function CarCard({ car, onSelect }: CarCardProps) {
  // Format price in Italy currency style (e.g., 25.900 €)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  // Format mileage
  const formatKm = (km: number) => {
    return new Intl.NumberFormat('it-IT').format(km) + ' km';
  };

  return (
    <motion.div
      id={`car-card-${car.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -6 }}
      onClick={() => onSelect(car.id)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/80 backdrop-blur-xs transition-all duration-300 hover:border-brand/50 hover:shadow-[0_12px_30px_rgba(0,71,255,0.15)] cursor-pointer"
    >
      {/* Badge container */}
      {car.badge && (
        <span id={`car-badge-${car.id}`} className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-brand/90 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur-xs shadow-lg">
          <Shield className="h-3.5 w-3.5" />
          {car.badge}
        </span>
      )}

      {/* Image container */}
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-900">
        <img
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Dark overlay with subtle blue tint on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 bg-brand/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Details body */}
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-bold uppercase tracking-widest text-brand mb-1">
          {car.brand}
        </span>
        <h3 className="font-display text-lg font-bold text-white line-clamp-1 group-hover:text-brand transition-colors duration-200">
          {car.modello ? `${car.modello} ${car.model}` : car.model}
        </h3>

        {/* Info Grid */}
        <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2 border-y border-neutral-900 py-3.5 text-xs text-neutral-400 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-neutral-600 shrink-0" />
            <span>Anno: <strong className="text-neutral-200">{car.year}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-neutral-600 shrink-0" />
            <span>{formatKm(car.km)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-neutral-600 shrink-0" />
            <span>Alim: <strong className="text-neutral-200">{car.fuelType}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 text-neutral-600 font-bold text-[10px] flex items-center justify-center border border-neutral-600 rounded-sm leading-none shrink-0">M</span>
            <span>Cambio: <strong className="text-neutral-200">{car.gearbox}</strong></span>
          </div>
        </div>

        {/* Pricing and Action footer */}
        <div className="mt-auto pt-5 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Prezzo</p>
            <p className="font-display text-2xl font-black text-white tracking-tight">
              {formatPrice(car.price)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id={`btn-details-${car.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(car.id);
              }}
              className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 group-hover:border-brand group-hover:bg-brand group-hover:text-white text-neutral-300 font-semibold px-3.5 py-2 rounded-lg text-[10px] tracking-wider uppercase transition-all duration-200 shrink-0"
            >
              Vedi Dettagli
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}