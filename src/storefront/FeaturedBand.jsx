import { ArrowRight } from 'lucide-react';
import { productImages } from '../lib/storefront';
import Reveal from './Reveal';

// ── Featured / Signature band ────────────────────────────────────────
// An intentionally ASYMMETRICAL editorial composition that breaks the
// uniform card grid (the main antidote to an "AI-generated" feel). A large
// off-set image on one side, generous whitespace and a serif statement on
// the other. Pure presentation — clicking opens the existing product modal.
export default function FeaturedBand({ product, onOpen }) {
  if (!product) return null;
  const img = productImages(product)[0];
  if (!img) return null;

  const priceNum = product.price != null ? Number(product.price) : null;
  const priceStr = priceNum ? '₹' + priceNum.toLocaleString('en-IN') : 'Price on request';
  const sub = [product.category, product.sub_category].filter(Boolean).join(' · ');

  return (
    <section className="mx-auto mt-20 max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Image — wide, offset, sits in 7 of 12 cols on desktop */}
        <Reveal
          as="button"
          variant="scale"
          type="button"
          onClick={() => onOpen?.(product)}
          className="group relative order-1 block aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-sand lg:order-none lg:col-span-7"
          data-magnetic
          aria-label={`View ${product.name}`}
        >
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            loading="lazy"
            draggable={false}
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-noir-900/40 via-transparent to-transparent" />
          {/* sheen sweep on hover */}
          <span className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute -inset-y-2 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:animate-sheenSweep group-hover:opacity-100" />
          </span>
        </Reveal>

        {/* Copy — narrow column, lots of air */}
        <Reveal className="lg:col-span-5 lg:pl-4">
          <p className="kicker mb-3">The Signature Piece</p>
          <h2 className="editorial text-[clamp(1.9rem,4vw,3rem)]">{product.name}</h2>
          {sub && <p className="mt-3 text-sm uppercase tracking-luxe text-ink-soft">{sub}</p>}
          {product.description && (
            <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-ink-mid line-clamp-4">
              {product.description}
            </p>
          )}
          <p className="mt-6 font-serif text-2xl font-bold text-ink">{priceStr}</p>
          <button
            onClick={() => onOpen?.(product)}
            className="mt-7 inline-flex items-center gap-2 border-b border-gold-500 pb-1 text-[13px] font-semibold uppercase tracking-luxe text-gold-700 transition hover:gap-3 hover:text-gold-800"
            data-magnetic
          >
            Discover the piece <ArrowRight size={15} />
          </button>
        </Reveal>
      </div>
    </section>
  );
}
