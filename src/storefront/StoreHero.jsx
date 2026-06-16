import { useMemo } from 'react';
import { Sparkles, ArrowRight, Tag, ShieldCheck, Camera, Star, Award, Gem } from 'lucide-react';
import { productImages } from '../lib/storefront';

export default function StoreHero({
  storeName,
  products = [],
  offers = [],
  productCount = 0,
  onExplore,
  onOpenOffers,
  onTryOn,
}) {
  const collage = useMemo(() => {
    const out = [];
    for (const p of products) {
      const img = productImages(p)[0];
      if (img) out.push({ id: p.id, img, name: p.name });
      if (out.length === 4) break;
    }
    return out;
  }, [products]);

  const hasOffers = offers.length > 0;
  const featured = collage[0];

  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* ── Rich layered background ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,#f4e0aa_0%,transparent_60%),linear-gradient(160deg,#fffdf9_0%,#fdf6ec_40%,#faf0e0_100%)]" />
      {/* Decorative large gold circle top-right */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full border border-gold-200/30 bg-gradient-to-br from-gold-100/50 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-[320px] w-[320px] rounded-full border border-gold-300/20 bg-transparent" aria-hidden="true" />
      {/* Bottom-left warm glow */}
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-maroon-100/30 blur-3xl" aria-hidden="true" />
      {/* Centre shimmer */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-100/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-0 lg:px-8 lg:py-0">

        {/* ── Left: Copy ── */}
        <div className="animate-fadeUp lg:py-20 lg:pr-10">
          {/* Eyebrow pill */}
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/60 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-luxe text-gold-700 shadow-[0_2px_8px_rgba(184,134,11,.12)] backdrop-blur-sm">
            <Sparkles size={12} className="fill-gold-400 text-gold-400" />
            Handcrafted · Hallmarked · Timeless
          </span>

          {/* Headline */}
          <h1 className="display mt-5 text-[36px] leading-[1.08] tracking-tight sm:text-[48px] lg:text-[54px]">
            Jewellery that<br />
            <span className="relative">
              <span className="relative z-10 bg-gold-sheen bg-clip-text text-transparent">tells your story</span>
              {/* Underline accent */}
              <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gold-rule opacity-60" aria-hidden="true" />
            </span>
          </h1>

          {/* Subcopy */}
          <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-ink-mid">
            Discover {productCount > 0 ? <><strong className="text-ink">{productCount}+</strong>{' '}</> : ''}exquisite pieces
            from <span className="font-semibold text-ink">{storeName}</span> — gold, diamond &amp; silver, each crafted to
            be treasured for generations.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onExplore} className="btn-gold text-[14px]">
              Explore Collection <ArrowRight size={16} />
            </button>
            {featured && (
              <button onClick={() => onTryOn?.(products.find(p => p.id === featured.id))} className="btn-outline text-[14px]">
                <Camera size={15} /> AI Try-On
              </button>
            )}
            {hasOffers && (
              <button onClick={onOpenOffers} className="inline-flex items-center gap-1.5 rounded-full border border-maroon-100 bg-maroon-50 px-4 py-2.5 text-[13px] font-semibold text-maroon-600 transition hover:bg-maroon-100">
                <Tag size={14} /> View Offers
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { icon: ShieldCheck, label: 'Certified Quality' },
              { icon: Star,        label: 'AI Selfie Try-On' },
              { icon: Award,       label: 'Best Price Assured' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-100 text-gold-700">
                  <Icon size={15} />
                </span>
                <span className="text-[13px] font-medium text-ink-mid">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Collage ── */}
        <div className="relative animate-scaleIn lg:h-[560px]">

          {/* ─ Mobile / tablet: horizontal strip ─ */}
          {collage.length > 0 && (
            <div className="flex gap-3 lg:hidden">
              <figure className="relative h-48 flex-[1.5] overflow-hidden rounded-3xl border border-white/70 bg-sand shadow-cardHov ring-1 ring-gold-200/60 sm:h-60">
                <img src={collage[0].img} alt={collage[0].name} className="h-full w-full object-cover object-top" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-700 shadow-lift backdrop-blur">
                  <Sparkles size={10} /> New
                </span>
              </figure>
              {collage[1] && (
                <div className="flex flex-1 flex-col gap-3">
                  <figure className="flex-1 overflow-hidden rounded-2xl border border-white/70 bg-sand shadow-card ring-1 ring-gold-200/60">
                    <img src={collage[1].img} alt={collage[1].name} className="h-full w-full object-cover object-top" draggable={false} />
                  </figure>
                  {collage[2] && (
                    <figure className="flex-1 overflow-hidden rounded-2xl border border-white/70 bg-sand shadow-card ring-1 ring-gold-200/60">
                      <img src={collage[2].img} alt={collage[2].name} className="h-full w-full object-cover object-top" draggable={false} />
                    </figure>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─ Desktop: overlapping editorial collage ─ */}
          <div className="hidden lg:block">
            {collage.length > 0 ? (
              <>
                {/* Background decorative ring behind collage */}
                <div className="absolute right-8 top-8 h-[440px] w-[440px] rounded-full border-[1.5px] border-gold-200/40" aria-hidden="true" />
                <div className="absolute right-16 top-16 h-[380px] w-[380px] rounded-full border border-gold-100/60" aria-hidden="true" />

                {/* Primary — tall left-centre card */}
                <figure className="absolute left-[10%] top-[50%] h-[380px] w-[220px] -translate-y-1/2 overflow-hidden rounded-[28px] border-2 border-white bg-sand shadow-[0_24px_60px_-12px_rgba(138,101,8,.35)] ring-1 ring-gold-200/60">
                  <img src={collage[0].img} alt={collage[0].name} className="h-full w-full object-cover object-top" draggable={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </figure>

                {/* Second — tall right-centre card, offset down */}
                {collage[1] && (
                  <figure className="absolute right-[10%] top-[50%] h-[340px] w-[210px] -translate-y-[45%] overflow-hidden rounded-[28px] border-2 border-white bg-sand shadow-[0_20px_50px_-10px_rgba(42,33,24,.28)] ring-1 ring-gold-200/50">
                    <img src={collage[1].img} alt={collage[1].name} className="h-full w-full object-cover object-top" draggable={false} />
                  </figure>
                )}

                {/* Third — small card bridging the two, overlapping both */}
                {collage[2] && (
                  <figure className="absolute left-[50%] top-[50%] h-[200px] w-[160px] -translate-x-1/2 -translate-y-1/2 -rotate-1 overflow-hidden rounded-[22px] border-2 border-white bg-sand shadow-[0_16px_40px_-8px_rgba(138,101,8,.3)] ring-1 ring-gold-200/60 z-10">
                    <img src={collage[2].img} alt={collage[2].name} className="h-full w-full object-cover object-top" draggable={false} />
                  </figure>
                )}

                {/* Fourth — small top accent above centre */}
                {collage[3] && (
                  <figure className="absolute left-[50%] top-[6%] h-[130px] w-[120px] -translate-x-1/2 rotate-1 overflow-hidden rounded-[18px] border-2 border-white bg-sand shadow-lift ring-1 ring-gold-200/50">
                    <img src={collage[3].img} alt={collage[3].name} className="h-full w-full object-cover object-top" draggable={false} />
                  </figure>
                )}

                {/* Floating "New Arrivals" badge — bottom-left */}
                <div className="absolute bottom-10 left-[6%] flex items-center gap-2 rounded-2xl border border-gold-200/60 bg-white/95 px-4 py-2.5 shadow-[0_8px_24px_-4px_rgba(138,101,8,.2)] backdrop-blur-sm z-20">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
                    <Gem size={14} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-luxe text-gold-700">New Arrivals</p>
                    <p className="text-[12px] font-semibold text-ink">{storeName}</p>
                  </div>
                </div>

                {/* Floating AI Try-On badge — bottom-right */}
                <div className="absolute bottom-10 right-[6%] flex items-center gap-2 rounded-2xl border border-gold-200/60 bg-white/95 px-3 py-2 shadow-lift backdrop-blur-sm z-20">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-100 text-gold-700">
                    <Camera size={13} />
                  </span>
                  <span className="text-[11px] font-semibold text-ink">AI Try-On</span>
                </div>
              </>
            ) : (
              /* No products yet — decorative placeholder */
              <div className="absolute inset-x-8 inset-y-10 grid place-items-center rounded-[32px] border border-gold-200/50 bg-white/40 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3 text-gold-300">
                  <Gem size={56} strokeWidth={1} />
                  <p className="text-sm font-medium text-gold-500">{storeName}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
