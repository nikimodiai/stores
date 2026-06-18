import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { CATEGORIES } from '../lib/config';
import Reveal from './Reveal';

const LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
const labelFor = (cat) => LABELS[cat] || cat;

// Curated "type" shortcuts that aren't 1:1 categories — these search the
// catalogue (matchesSearch spans metal/stone/collection/name) so they work
// for any store without hard-coding its data.
const SEARCH_CHIPS = [
  { label: 'Gold', q: 'gold' },
  { label: 'Diamond', q: 'diamond' },
  { label: 'Bridal', q: 'bridal' },
];

// ── Quick links ──────────────────────────────────────────────────────
// An elegant horizontal rail under the hero so a first-time visitor can
// dive straight into Rings / Earrings / Gold / Diamond / Bridal / New
// Arrivals without scrolling the full nav. Desktop = centred inline row;
// mobile = scrollable chips. Every chip drives existing storefront state.
export default function QuickLinks({
  categories = [],
  active,
  onSelectCategory,
  onSearch,
  onScrollLatest,
  hasLatest,
}) {
  // Show the most shopped categories first, in canonical order, capped so
  // the rail stays elegant rather than exhaustive (the full list lives in
  // the header nav + category rail).
  const catChips = useMemo(() => {
    const order = CATEGORIES.map(c => c.value);
    return [...categories]
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .slice(0, 7);
  }, [categories]);

  if (catChips.length === 0) return null;

  const base =
    'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition';
  const idle =
    'border-line bg-white text-ink-mid hover:border-gold-300 hover:text-ink hover:-translate-y-px';
  const sel =
    'border-gold-500 bg-gold-50 text-gold-700';

  return (
    <Reveal
      as="nav"
      stagger
      gap={0.05}
      className="border-b border-line bg-cream/80 backdrop-blur-sm"
      aria-label="Quick links"
    >
      <div className="no-scrollbar mx-auto flex max-w-[1280px] items-center gap-2.5 overflow-x-auto px-4 py-3.5 sm:justify-center sm:px-6 lg:px-8">
        {hasLatest && (
          <Reveal
            as="button"
            item
            onClick={onScrollLatest}
            className={`${base} border-gold-300 bg-gold-sheen text-white shadow-gold hover:-translate-y-px`}
            data-magnetic
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} /> New Arrivals
            </span>
          </Reveal>
        )}

        {catChips.map(cat => (
          <Reveal
            as="button"
            item
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`${base} ${active === cat ? sel : idle}`}
            data-magnetic
          >
            {labelFor(cat)}
          </Reveal>
        ))}

        <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-line sm:block" aria-hidden="true" />

        {SEARCH_CHIPS.map(({ label, q }) => (
          <Reveal
            as="button"
            item
            key={label}
            onClick={() => onSearch(q)}
            className={`${base} ${idle}`}
            data-magnetic
          >
            {label}
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}
