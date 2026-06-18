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

const AUTO_MS = 4000;

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
      className="relative mt-10 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Subtle ambient glow behind the card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-32 w-96 rounded-full bg-gold-300/10 blur-[60px]" />
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255,248,235,0.85) 0%, rgba(255,255,255,0.75) 60%, rgba(253,244,215,0.8) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        className="relative mx-auto max-w-2xl rounded-2xl border border-gold-200/70 px-8 py-8 shadow-[0_4px_32px_rgba(179,142,56,0.10)]"
      >
        {/* Gold accent line at top */}
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

        {/* Quote icon */}
        <div className="mb-4 flex justify-center">
          <Quote size={24} className="text-gold-400/60" />
        </div>

        <div className="relative min-h-[100px] text-center">
          <AnimatePresence mode="wait">
            <m.figure
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {r.rating != null && (
                <div className="mb-3 flex justify-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(r.rating) ? 'fill-gold-400 text-gold-400' : 'text-gold-200'}
                    />
                  ))}
                </div>
              )}
              <blockquote className="font-display text-[clamp(0.95rem,1.8vw,1.15rem)] italic leading-relaxed text-ink">
                "{r.body}"
              </blockquote>
              <figcaption className="mt-5 flex items-center justify-center gap-2.5">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-gold-300/60" draggable={false} />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-100 text-[11px] font-bold text-gold-700">
                    {initials}
                  </span>
                )}
                <span className="text-xs font-semibold tracking-widest uppercase text-ink-mid">{r.customer_name || 'Verified buyer'}</span>
              </figcaption>
            </m.figure>
          </AnimatePresence>
        </div>

        {reviews.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => go(-1)}
              className="grid h-7 w-7 place-items-center rounded-full border border-gold-300/50 text-gold-600 transition hover:border-gold-500 hover:bg-gold-50"
              aria-label="Previous review"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1">
              {reviews.map((rev, i) => (
                <button
                  key={rev.id}
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all duration-500 ${i === idx ? 'h-1.5 w-6 bg-gold-500' : 'h-1.5 w-1.5 bg-gold-300/40 hover:bg-gold-300/70'}`}
                  aria-label={`Review ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              className="grid h-7 w-7 place-items-center rounded-full border border-gold-300/50 text-gold-600 transition hover:border-gold-500 hover:bg-gold-50"
              aria-label="Next review"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trust section ────────────────────────────────────────────────────
// Always renders the craftsmanship/assurance pillars. Renders the review
// slider ONLY when the store has real published reviews — never fabricated.
export default function TrustSection({ store, storeName, reviews = [], reviewsAnchorRef }) {
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

      {/* Anchor for the header's star-rating shortcut — lands here, at the
          actual reviews, rather than the top of the pillars above. */}
      <div ref={reviewsAnchorRef} className="scroll-mt-24">
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
      </div>

      <ReviewForm
        open={formOpen}
        ownerId={store?.owner_id}
        storeName={storeName}
        onClose={() => setFormOpen(false)}
      />
    </section>
  );
}
