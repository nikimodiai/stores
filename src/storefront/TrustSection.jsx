import { useState, useEffect, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Sparkles, BadgeIndianRupee, MessageCircle, Quote, Star,
  ChevronLeft, ChevronRight, PenLine,
} from 'lucide-react';
import { EASE } from '../lib/motion';
import Reveal from './Reveal';
import ReviewForm from './ReviewForm';

// Editorial assurance pillars — real, store-true claims (no fabrication).
const PILLARS = [
  { icon: ShieldCheck,       title: 'Certified & Hallmarked', body: 'Every piece is quality-assured and hallmarked — authenticity you can trust.' },
  { icon: Sparkles,          title: 'AI Selfie Try-On',       body: 'See exactly how a piece looks on you before you ever visit the store.' },
  { icon: BadgeIndianRupee,  title: 'Best Price Assured',     body: 'Fair, transparent pricing on gold, diamond and silver — every single day.' },
  { icon: MessageCircle,     title: 'Personal Concierge',     body: 'Questions? Chat with the store directly on WhatsApp for a tailored answer.' },
];

const AUTO_MS = 5500;

// Auto-sliding review carousel — only mounted when real reviews exist.
function ReviewSlider({ reviews }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (reviews.length <= 1 || paused || reduced.current) return;
    const t = setInterval(() => setIdx(i => (i + 1) % reviews.length), AUTO_MS);
    return () => clearInterval(t);
  }, [reviews.length, paused]);

  const go = (dir) => setIdx(i => (i + dir + reviews.length) % reviews.length);
  const r = reviews[idx];
  const initials = useMemo(
    () => (r?.customer_name || 'Guest').trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join(''),
    [r],
  );

  return (
    <div
      className="relative mt-16 overflow-hidden rounded-[28px] border border-noir-500/60 bg-noir-800 px-6 py-12 text-champagne-50 shadow-noir sm:px-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/10 blur-[90px]" aria-hidden="true" />
      <Quote size={40} className="mx-auto text-gold-400/70" />

      <div className="relative mx-auto mt-6 min-h-[150px] max-w-2xl text-center">
        <AnimatePresence mode="wait">
          <m.figure
            key={r.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {r.rating != null && (
              <div className="mb-4 flex justify-center gap-1" aria-label={`${r.rating} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(r.rating) ? 'fill-gold-300 text-gold-300' : 'text-champagne-100/25'}
                  />
                ))}
              </div>
            )}
            <blockquote className="font-display text-[clamp(1.2rem,2.4vw,1.7rem)] italic leading-relaxed text-champagne-50">
              “{r.body}”
            </blockquote>
            <figcaption className="mt-6 flex items-center justify-center gap-3">
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-gold-300/40" draggable={false} />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-champ-sheen text-[13px] font-bold text-noir-800">
                  {initials}
                </span>
              )}
              <span className="text-sm font-semibold tracking-wide text-champagne-200">{r.customer_name || 'Verified buyer'}</span>
            </figcaption>
          </m.figure>
        </AnimatePresence>
      </div>

      {reviews.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => go(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-champagne-300/25 text-champagne-200 transition hover:border-champagne-300/60 hover:text-champagne-50"
            aria-label="Previous review"
            data-magnetic
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            {reviews.map((rev, i) => (
              <button
                key={rev.id}
                onClick={() => setIdx(i)}
                className={`h-[3px] rounded-full transition-all duration-500 ${i === idx ? 'w-7 bg-gold-300' : 'w-3 bg-champagne-100/25'}`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-champagne-300/25 text-champagne-200 transition hover:border-champagne-300/60 hover:text-champagne-50"
            aria-label="Next review"
            data-magnetic
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Trust section ────────────────────────────────────────────────────
// Always renders the craftsmanship/assurance pillars. Renders the review
// slider ONLY when the store has real published reviews — never fabricated.
export default function TrustSection({ store, storeName, reviews = [] }) {
  const [formOpen, setFormOpen] = useState(false);
  const hasReviews = reviews.length > 0;

  return (
    <section className="mx-auto mt-20 max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="kicker mb-2">Why {storeName}</p>
        <h2 className="editorial text-[clamp(1.9rem,4vw,3rem)]">The promise behind every piece</h2>
        <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
      </div>

      <Reveal stagger gap={0.08} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <Reveal
            item
            key={title}
            className="group rounded-2xl border border-line bg-white p-6 transition hover:border-gold-200 hover:shadow-card"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gold-50 text-gold-700 transition group-hover:bg-gold-100">
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 font-serif text-lg font-bold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-mid">{body}</p>
          </Reveal>
        ))}
      </Reveal>

      {hasReviews && <ReviewSlider reviews={reviews} />}

      {/* Write-a-review CTA — always available so customers can share their
          experience; submissions are verified by the store before showing. */}
      <Reveal className="mt-10 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-ink-mid">
          {hasReviews ? 'Bought from us before?' : `Be the first to review ${storeName}.`}
        </p>
        <button onClick={() => setFormOpen(true)} className="btn-outline" data-magnetic>
          <PenLine size={16} /> Write a review
        </button>
      </Reveal>

      <ReviewForm
        open={formOpen}
        ownerId={store?.owner_id}
        storeName={storeName}
        onClose={() => setFormOpen(false)}
      />
    </section>
  );
}
