import { useState, useEffect } from 'react';
import { X, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { submitReview } from '../lib/storefront';

// ── Customer review form ─────────────────────────────────────────────
// A modal that lets a customer share their experience with the jeweller.
// Submissions land as status = 'pending' and only appear on the storefront
// once the jeweller approves them (status = 'approved') — they can also be
// rejected — so this can never be used to self-publish or spam the carousel.
export default function ReviewForm({ open, ownerId, storeName, onClose }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  // Reset + lock scroll + Escape-to-close while open.
  useEffect(() => {
    if (!open) return;
    setName(''); setRating(0); setHover(0); setBody(''); setStatus('idle'); setError('');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending'); setError('');
    const res = await submitReview({ ownerId, customerName: name, rating, body });
    if (res.ok) setStatus('done');
    else { setStatus('error'); setError(res.error || 'Could not submit your review.'); }
  };

  return (
    <div
      className="fixed inset-0 z-[115] flex items-start justify-center overflow-y-auto bg-noir-900/72 p-3 backdrop-blur-md sm:p-6 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Write a review"
    >
      <div
        className="relative my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-cream shadow-[0_30px_80px_-20px_rgba(42,33,24,.5)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gold-rule" />
        <button
          className="absolute right-3 top-4 z-10 grid h-10 w-10 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {status === 'done' ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-50 text-gold-700">
              <CheckCircle2 size={34} strokeWidth={1.75} />
            </span>
            <h2 className="font-serif text-xl font-bold text-ink">Thank you!</h2>
            <p className="max-w-[44ch] text-sm leading-relaxed text-ink-mid">
              Your review has been sent to {storeName || 'the store'} for approval. Once verified,
              it will appear here for other customers to see.
            </p>
            <button onClick={onClose} className="btn-gold mt-2" data-magnetic>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-7 sm:px-8">
            <p className="kicker mb-1.5">Your experience</p>
            <h2 className="editorial text-2xl">Write a review</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-mid">
              Share your experience with {storeName || 'this store'}. Reviews are verified by the
              store before they appear.
            </p>

            {/* Star rating */}
            <div className="mt-6">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-luxe text-ink-mid">Your rating</label>
              <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-gold-50"
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    aria-pressed={rating === n}
                  >
                    <Star
                      size={26}
                      className={(hover || rating) >= n ? 'fill-gold-400 text-gold-500' : 'text-stone-300'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mt-5">
              <label htmlFor="rv-name" className="mb-2 block text-[11px] font-bold uppercase tracking-luxe text-ink-mid">Your name</label>
              <input
                id="rv-name"
                className="form-input w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
                placeholder="e.g. Aarav S."
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="mt-5">
              <label htmlFor="rv-body" className="mb-2 block text-[11px] font-bold uppercase tracking-luxe text-ink-mid">Your review</label>
              <textarea
                id="rv-body"
                rows={4}
                maxLength={2000}
                className="form-textarea w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition placeholder:text-ink-soft focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
                placeholder="Tell others about the craftsmanship, service and your experience…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <span className="mt-1 block text-right text-[11px] text-ink-soft">{body.length}/2000</span>
            </div>

            {status === 'error' && (
              <p className="mt-3 rounded-xl bg-maroon-50 px-3.5 py-2.5 text-[13px] text-maroon-600">{error}</p>
            )}

            <button type="submit" className="btn-gold mt-6 w-full" disabled={status === 'sending'} data-magnetic>
              {status === 'sending' ? (<><Loader2 size={17} className="animate-spin" /> Submitting…</>) : 'Submit review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
