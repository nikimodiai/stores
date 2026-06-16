import { useMemo } from 'react';
import {
  Gem, Circle, CircleDot, Sparkles, Watch, Crown, Link2, Hand,
  Coins, Diamond, ChevronRight,
} from 'lucide-react';
import { CATEGORIES } from '../lib/config';
import { productImages } from '../lib/storefront';

const LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
const labelFor = (cat) => LABELS[cat] || cat;

// A representative Lucide icon per category (no emojis anywhere).
const ICONS = {
  Ring: CircleDot, Earring: Sparkles, Necklace: Gem, Bangle: Circle,
  Bracelet: Watch, Pendant: Diamond, Mangalsutra: Gem, Chain: Link2,
  Anklet: Circle, Nosepin: Sparkles, 'Maang Tikka': Crown, Set: Crown,
  Coin: Coins, 'Lab-Grown Diamond': Diamond, 'Loose Stone': Diamond,
  Silver: Coins, Bajuband: Hand, Kamarband: Hand, 'Haath Phool': Hand,
  Bichhiya: Circle, Brooch: Sparkles, Other: Gem,
};
const iconFor = (cat) => ICONS[cat] || Gem;

// ── Category rail (home view) ───────────────────────────────────────
// A friendly, scannable "Shop by Category" row so a first-time visitor
// can browse without knowing what they want. Each tile uses a real
// product photo from that category when available, falling back to a
// Lucide icon on a warm gradient. Clicking sets the active category.
export default function CategoryRail({ products = [], categories = [], active, onSelect }) {
  // One cover image per category (first product with an image).
  const covers = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (p.category && !map[p.category]) {
        const img = productImages(p)[0];
        if (img) map[p.category] = img;
      }
    }
    return map;
  }, [products]);

  // Count per category for a subtle "(n)" hint.
  const counts = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (p.category) map[p.category] = (map[p.category] || 0) + 1;
    }
    return map;
  }, [products]);

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="kicker mb-1.5">Browse</p>
          <h2 className="display text-2xl sm:text-[28px]">Shop by Category</h2>
        </div>
        <span className="hidden text-[13px] text-ink-mid sm:inline">Find exactly what you love</span>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {categories.map(cat => {
          const Icon = iconFor(cat);
          const cover = covers[cat];
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`group flex w-[120px] shrink-0 flex-col items-center gap-2.5 rounded-2xl border p-3 text-center transition sm:w-auto ${
                isActive
                  ? 'border-gold-300 bg-gold-50 shadow-card'
                  : 'border-line bg-white hover:border-gold-200 hover:shadow-card'
              }`}
            >
              <span className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-gold-200/60 sm:h-[72px] sm:w-[72px]">
                {cover ? (
                  <img src={cover} alt="" className="h-full w-full object-cover object-top transition group-hover:scale-110" draggable={false} />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-hero-warm text-gold-600">
                    <Icon size={26} strokeWidth={1.5} />
                  </span>
                )}
              </span>
              <span className="text-[12.5px] font-semibold leading-tight text-ink">{labelFor(cat)}</span>
              {counts[cat] ? (
                <span className="text-[11px] text-ink-mid">{counts[cat]} piece{counts[cat] > 1 ? 's' : ''}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {active && (
        <button
          onClick={() => onSelect(null)}
          className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-gold-700 transition hover:text-gold-800"
        >
          View all categories <ChevronRight size={14} />
        </button>
      )}
    </section>
  );
}
