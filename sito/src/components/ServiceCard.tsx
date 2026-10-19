import { ServiceItem } from '../types';
import * as LucideIcons from 'lucide-react';
import { motion } from 'motion/react';

interface ServiceCardProps {
  service: ServiceItem;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  // Dynamically resolve icon from name
  const IconComponent = (LucideIcons as any)[service.iconName] || LucideIcons.HelpCircle;

  return (
    <motion.div
      id={`service-${service.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="group relative rounded-xl border border-neutral-900 bg-neutral-950/40 p-6 md:p-8 transition-all duration-300 hover:border-brand/30 hover:bg-neutral-950/80 hover:shadow-[0_8px_25px_rgba(0,71,255,0.08)]"
    >
      {/* Decorative background blue glow */}
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-brand/5 blur-2xl transition-opacity duration-300 opacity-50 group-hover:opacity-100" />

      {/* Icon container */}
      <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white group-hover:border-brand">
        <IconComponent className="h-6 w-6" />
      </div>

      <h3 className="font-display text-xl font-bold text-white mb-3 tracking-wide group-hover:text-brand transition-colors duration-200">
        {service.title}
      </h3>
      
      <p className="text-sm leading-relaxed text-neutral-400 font-normal">
        {service.description}
      </p>
    </motion.div>
  );
}
