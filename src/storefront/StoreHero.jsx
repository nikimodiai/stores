import { useMemo, useEffect, useRef, useCallback } from 'react';
import { m, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Tag, Camera, ChevronDown, Sparkles } from 'lucide-react';
import { productImages } from '../lib/storefront';
import { EASE } from '../lib/motion';

// ── Cinematic hero ───────────────────────────────────────────────────
// DARK hero with a contained zig-zag photo mosaic (not full-bleed) beside
// the brand statement in Cormorant display type, gold light-bloom, and
// micro mouse-parallax. Degrades gracefully: no images → copy-only;
// reduced-motion → no parallax (handled by guards).
export default function StoreHero({
  storeName,
  products = [],
  offers = [],
  productCount = 0,
  onExplore,
  onOpenOffers,
  onTryOn,
}) {
  // Up to 5 distinct slides drawn from the freshest catalogue imagery.
  const slides = useMemo(() => {
    const out = [];
    const seen = new Set();
    for (const p of products) {
      const img = productImages(p)[0];
      if (img && !seen.has(img)) {
        seen.add(img);
        out.push({ id: p.id, img, name: p.name, product: p });
      }
      if (out.length === 5) break;
    }
    return out;
  }, [products]);

  const hasOffers = offers.length > 0;
  const featured = slides[0]?.product || products[0] || null;

  // ── Micro-parallax (desktop, motion-allowed only) ──
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });
  const imgX = useTransform(sx, v => v * -18);
  const imgY = useTransform(sy, v => v * -14);
  const copyX = useTransform(sx, v => v * 10);
  const copyY = useTransform(sy, v => v * 8);
  const parallaxOn = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia?.('(pointer: fine)').matches;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    parallaxOn.current = !!fine && !reduced;
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!parallaxOn.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }, [mx, my]);

  const onMouseLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  const fadeIn = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } };

  return (
    <section
      className="relative isolate flex min-h-[88svh] w-full items-center overflow-hidden bg-rosegold-900 bg-rosegold-deep text-champagne-50"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      aria-label={`${storeName} — featured`}
    >
      {/* ── Ambient warm glow (no full-bleed photo, no heavy scrim) ── */}
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[620px] w-[620px] rounded-full bg-gold-500/15 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-[420px] w-[420px] rounded-full bg-rosegold-400/20 blur-[120px]" aria-hidden="true" />

      {/* ── Copy + mosaic, side by side ── */}
      <m.div
        className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 px-5 pb-[7vh] pt-[150px] sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-[170px] lg:pb-0"
        style={{ x: copyX, y: copyY }}
      >
        <m.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
          className="max-w-2xl"
        >
          {/* Eyebrow */}
          <m.span
            variants={fadeIn}
            transition={{ duration: 0.7, ease: EASE }}
            className="inline-flex items-center gap-2.5 rounded-full border border-champagne-300/30 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-ultra text-champagne-200 backdrop-blur-sm"
          >
            <Sparkles size={12} className="text-gold-300" />
            Handcrafted · Hallmarked · Timeless
          </m.span>

          {/* Headline */}
          <m.h1
            variants={fadeIn}
            transition={{ duration: 0.8, ease: EASE }}
            className="editorial mt-6 text-[clamp(2.6rem,7vw,5.2rem)] text-champagne-50"
          >
            Jewellery that
            <br />
            <span className="bg-champ-sheen bg-clip-text italic text-transparent">tells your story</span>
          </m.h1>

          {/* Subcopy */}
          <m.p
            variants={fadeIn}
            transition={{ duration: 0.8, ease: EASE }}
            className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-champagne-100/80 sm:text-base"
          >
            {productCount > 0 ? <><span className="font-semibold text-champagne-50">{productCount}+</span>{' '}</> : ''}
            exquisite pieces from <span className="font-semibold text-champagne-50">{storeName}</span> — gold,
            diamond &amp; silver, each crafted to be treasured for generations.
          </m.p>

          {/* CTAs */}
          <m.div
            variants={fadeIn}
            transition={{ duration: 0.8, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <button onClick={onExplore} className="btn-gold text-[14px]" data-magnetic>
              Explore Collection <ArrowRight size={16} />
            </button>
            {featured && (
              <button onClick={() => onTryOn?.(featured)} className="btn-ghost-light text-[14px]" data-magnetic>
                <Camera size={15} /> AI Try-On
              </button>
            )}
            {hasOffers && (
              <button
                onClick={onOpenOffers}
                className="inline-flex items-center gap-1.5 rounded-full border border-champagne-300/25 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-champagne-100 backdrop-blur-sm transition hover:border-champagne-300/60 hover:bg-white/10"
                data-magnetic
              >
                <Tag size={14} /> View Offers
              </button>
            )}
          </m.div>

          {/* Credentials */}
          <m.div
            variants={fadeIn}
            transition={{ duration: 0.8, ease: EASE }}
            className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[12px] uppercase tracking-luxe text-champagne-200/70"
          >
            <span>Certified Quality</span>
            <span className="hidden sm:inline text-champagne-300/30">·</span>
            <span>AI Selfie Try-On</span>
            <span className="hidden sm:inline text-champagne-300/30">·</span>
            <span>Best Price Assured</span>
          </m.div>
        </m.div>

        {/* ── Zig-zag photo mosaic — contained, not full-bleed ── */}
        {slides.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
            className="relative mx-auto hidden h-[440px] w-full max-w-[440px] sm:block lg:h-[480px]"
            aria-hidden="true"
          >
            {slides.slice(0, 5).map((s, i) => {
              const TILE_LAYOUT = [
                'left-0 top-6 h-[58%] w-[56%] z-20',
                'right-0 top-0 h-[42%] w-[42%] z-10',
                'right-2 top-[46%] h-[38%] w-[44%] z-10',
                'left-[8%] bottom-0 h-[34%] w-[38%] z-30',
                'right-[18%] bottom-2 h-[28%] w-[30%] z-0',
              ];
              return (
                <div
                  key={s.id}
                  className={`absolute overflow-hidden rounded-2xl border border-champagne-300/15 shadow-[0_18px_50px_-12px_rgba(0,0,0,.5)] ${TILE_LAYOUT[i]}`}
                >
                  <img
                    src={s.img}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </div>
              );
            })}
          </m.div>
        )}
      </m.div>

      {/* ── Scroll cue ── */}
      <button
        onClick={onExplore}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-champagne-200/60 transition hover:text-champagne-100"
        aria-label="Scroll to collection"
      >
        <span className="text-[10px] font-semibold uppercase tracking-ultra">Scroll</span>
        <ChevronDown size={16} className="animate-scrollCue" />
      </button>
    </section>
  );
}
