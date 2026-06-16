import { useEffect, useState } from 'react';
import { X, Tag, BadgeCheck, CalendarClock } from 'lucide-react';

// ── Offers modal ────────────────────────────────────────────────────
// Opened from the "Offers" nav tab. Shows the store's current, valid
// offers (already filtered by owner_id + is_active + valid_to in
// getStorefrontOffers). When there are none, shows a friendly fallback
// reassuring the customer that prices are still the best in the industry.
export default function OffersModal({ open, offers = [], storeName, onClose }) {
  const [zoomedUrl, setZoomedUrl] = useState(null);

  // Close on Escape; lock body scroll while open. Escape closes the
  // lightbox first, then the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setZoomedUrl(prev => {
        if (prev) return null;
        onClose();
        return null;
      });
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setZoomedUrl(null);
  }, [open]);

  if (!open) return null;

  const hasOffers = offers.length > 0;

  const fmtDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/45 p-3 backdrop-blur-sm sm:p-6 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Current offers"
    >
      <div
        className="my-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-cream shadow-[0_30px_80px_-20px_rgba(42,33,24,.5)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line bg-gradient-to-r from-gold-50 to-cream px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-maroon-500 text-white">
              <Tag size={17} />
            </span>
            <h2 className="display text-xl">Current Offers</h2>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
          {hasOffers ? (
            <ul className="flex flex-col gap-4">
              {offers.map((o) => {
                const validTo = fmtDate(o.valid_to);
                return (
                  <li
                    key={o.id}
                    className="overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-card sm:flex"
                  >
                    {o.media_type === 'image' && o.media_url && (
                      <button
                        type="button"
                        className="block w-full shrink-0 overflow-hidden bg-sand sm:w-44"
                        onClick={() => setZoomedUrl(o.media_url)}
                        aria-label={`View ${o.title} image`}
                      >
                        <img src={o.media_url} alt={o.title} className="h-44 w-full object-cover transition hover:scale-105 sm:h-full" draggable={false} />
                      </button>
                    )}
                    <div className="flex flex-1 flex-col justify-center p-4">
                      <h3 className="font-serif text-lg font-bold text-ink">{o.title}</h3>
                      {o.description && <p className="mt-1 text-sm leading-relaxed text-ink-mid">{o.description}</p>}
                      {validTo && (
                        <span className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-maroon-50 px-2.5 py-1 text-xs font-medium text-maroon-600">
                          <CalendarClock size={13} /> Valid till {validTo}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-50 text-gold-500">
                <BadgeCheck size={34} strokeWidth={1.5} />
              </span>
              <p className="font-serif text-lg font-bold text-ink">No offers running right now</p>
              <p className="max-w-[46ch] text-sm leading-relaxed text-ink-mid">
                We&apos;re not running any special offers at the moment — but rest assured,
                {storeName ? ` ${storeName}'s` : ' our'} prices are among the best in the
                industry. Every piece is fairly priced, every day.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Maximised image lightbox */}
      {zoomedUrl && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-ink/85 p-4 animate-fadeIn"
          onClick={(e) => { e.stopPropagation(); setZoomedUrl(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Offer image"
        >
          <button
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            onClick={(e) => { e.stopPropagation(); setZoomedUrl(null); }}
            aria-label="Close image"
          >
            <X size={22} />
          </button>
          <img
            src={zoomedUrl}
            alt=""
            className="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
