import { useMemo } from 'react';
import { Sparkles, ArrowRight, Tag, ShieldCheck, Camera } from 'lucide-react';
import { productImages } from '../lib/storefront';

// ── Premium static hero ─────────────────────────────────────────────
// Editorial Tanishq-style hero: warm-gold gradient field, an offset
// collage of the store's own product photos on the right, a bold serif
// headline + subcopy on the left, and three real CTAs:
//   • Explore Collection  → scrolls to the catalogue
//   • Selfie Try-On       → opens try-on on a featured product
//   • View Offers         → opens the offers modal (only if offers exist)
// No external imagery required — falls back to a clean gradient panel
// when the store has no usable product photos yet.
export default function StoreHero({
  storeName,
  products = [],
  offers = [],
  productCount = 0,
  onExplore,
  onOpenOffers,
  onTryOn,
}) {
  // Pick up to 3 product photos for the collage (first usable image each).
  const collage = useMemo(() => {
    const out = [];
    for (const p of products) {
      const img = productImages(p)[0];
      if (img) out.push({ id: p.id, img, name: p.name });
      if (out.length === 3) break;
    }
    return out;
  }, [products]);

  const hasOffers = offers.length > 0;
  const featured = collage[0];

  return (
    <section className="relative overflow-hidden border-b border-line bg-hero-warm">
      {/* Soft decorative glow */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold-200/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-maroon-100/40 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-8 lg:py-20">
        {/* ── Mobile / tablet hero visual ──
            The desktop collage is hidden below lg; show a compact image
            strip here so small screens aren't left with an empty gradient. */}
        {collage.length > 0 && (
          <div className="order-first lg:hidden animate-scaleIn">
            <div className="flex gap-3">
              <figure className="relative h-44 flex-[1.4] overflow-hidden rounded-3xl border border-white/60 bg-sand shadow-card ring-1 ring-gold-200/50 sm:h-56">
                <img src={collage[0].img} alt={collage[0].name} className="h-full w-full object-cover object-top" draggable={false} />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gold-700 shadow-lift backdrop-blur">
                  <Sparkles size={12} /> New
                </span>
              </figure>
              {collage[1] && (
                <div className="flex flex-1 flex-col gap-3">
                  <figure className="h-[5.25rem] flex-1 overflow-hidden rounded-2xl border border-white/60 bg-sand shadow-card ring-1 ring-gold-200/50 sm:h-[6.5rem]">
                    <img src={collage[1].img} alt={collage[1].name} className="h-full w-full object-cover object-top" draggable={false} />
                  </figure>
                  {collage[2] && (
                    <figure className="h-[5.25rem] flex-1 overflow-hidden rounded-2xl border border-white/60 bg-sand shadow-card ring-1 ring-gold-200/50 sm:h-[6.5rem]">
                      <img src={collage[2].img} alt={collage[2].name} className="h-full w-full object-cover object-top" draggable={false} />
                    </figure>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Copy ── */}
        <div className="animate-fadeUp">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-white/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-luxe text-gold-700 backdrop-blur">
            <Sparkles size={13} /> Handcrafted · Hallmarked · Timeless
          </span>

          <h1 className="display mt-5 text-[34px] leading-[1.1] sm:text-5xl lg:text-[56px]">
            Jewellery that<br />
            <span className="bg-gold-sheen bg-clip-text text-transparent">tells your story</span>
          </h1>

          <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-ink-mid sm:text-base">
            Discover {productCount > 0 ? `${productCount}+ ` : ''}exquisite pieces from{' '}
            <span className="font-semibold text-ink">{storeName}</span> — gold, diamond and silver,
            each crafted to be treasured for generations. Now with an AI Selfie Try-On to see it on you, instantly.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onExplore} className="btn-gold">
              Explore Collection <ArrowRight size={17} />
            </button>
            {featured && (
              <button onClick={() => onTryOn?.(products.find(p => p.id === featured.id))} className="btn-outline">
                <Camera size={16} /> Selfie Try-On
              </button>
            )}
            {hasOffers && (
              <button
                onClick={onOpenOffers}
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-maroon-600 transition hover:text-maroon-700"
              >
                <Tag size={16} /> View Offers
              </button>
            )}
          </div>

          {/* Trust row */}
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-ink-mid">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-gold-700" /> Certified quality</span>
            <span className="inline-flex items-center gap-2"><Sparkles size={16} className="text-gold-700" /> AI Try-On</span>
            <span className="inline-flex items-center gap-2"><Tag size={16} className="text-gold-700" /> Best price assured</span>
          </div>
        </div>

        {/* ── Collage ── */}
        <div className="relative hidden h-[420px] lg:block animate-scaleIn">
          {collage.length > 0 ? (
            <>
              {/* Large primary */}
              <figure className="absolute right-2 top-0 h-[300px] w-[260px] overflow-hidden rounded-[28px] border border-white/60 bg-sand shadow-cardHov ring-1 ring-gold-200/50">
                <img src={collage[0].img} alt={collage[0].name} className="h-full w-full object-cover object-top" draggable={false} />
              </figure>
              {/* Lower-left */}
              {collage[1] && (
                <figure className="absolute bottom-2 left-0 h-[210px] w-[200px] overflow-hidden rounded-[24px] border border-white/60 bg-sand shadow-lift ring-1 ring-gold-200/50">
                  <img src={collage[1].img} alt={collage[1].name} className="h-full w-full object-cover object-top" draggable={false} />
                </figure>
              )}
              {/* Small accent */}
              {collage[2] && (
                <figure className="absolute bottom-24 right-0 h-[140px] w-[140px] overflow-hidden rounded-[20px] border border-white/60 bg-sand shadow-lift ring-1 ring-gold-200/50">
                  <img src={collage[2].img} alt={collage[2].name} className="h-full w-full object-cover object-top" draggable={false} />
                </figure>
              )}
              {/* Floating badge */}
              <span className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gold-700 shadow-lift backdrop-blur">
                <Sparkles size={13} /> New Arrivals
              </span>
            </>
          ) : (
            <div className="grid h-full place-items-center rounded-[28px] border border-gold-200/60 bg-white/40">
              <Sparkles size={64} strokeWidth={1} className="text-gold-300" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
