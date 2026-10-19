import { Review } from '../types';
import { Star, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ReviewCardProps {
  review: Review;
  /** Recensione di esempio (demo): badge dedicato, niente "Verificato" né "Google" */
  esempio?: boolean;
}

export default function ReviewCard({ review, esempio }: ReviewCardProps) {
  return (
    <motion.div
      id={`review-${review.id}`}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col justify-between rounded-xl border border-neutral-900 bg-neutral-950/50 p-6 md:p-8"
    >
      <div>
        {/* Star Rating & Verified Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-0.5 text-brand">
            {[...Array(review.rating)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-brand" />
            ))}
          </div>
          {esempio && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
              Esempio
            </span>
          )}
          {!esempio && review.verified && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-brand/80 bg-brand/10 px-2 py-0.5 rounded">
              <CheckCircle className="h-3 w-3" />
              Verificato
            </span>
          )}
        </div>

        {/* Review Text */}
        <p className="text-sm italic leading-relaxed text-neutral-300 font-normal">
          "{review.text}"
        </p>
      </div>

      {/* Reviewer Details */}
      <div className="mt-6 flex items-center gap-3 border-t border-neutral-900 pt-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-white uppercase tracking-wider">
          {review.initials}
        </div>
        <div>
          <h4 className="text-xs font-bold text-white tracking-wide">{review.author}</h4>
          <p className="text-[10px] text-neutral-500 font-medium">{esempio ? 'Recensione di esempio' : `${review.date} • Recensione Google`}</p>
        </div>
      </div>
    </motion.div>
  );
}
