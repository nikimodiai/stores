import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, SlidersHorizontal, ArrowUpDown, LayoutGrid, List, Gem,
  Menu, Tag, MapPin, Phone, Check, ChevronDown, ChevronRight, Star,
} from 'lucide-react';
import { CATEGORIES } from '../lib/config';
import { SORT_OPTIONS } from '../lib/storefront';
import PredictiveSearch from './PredictiveSearch';

// Map a raw category value (e.g. "Ring") to its display label ("Rings").
const LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
const labelFor = (cat) => LABELS[cat] || cat;

// Normalise a phone number into a wa.me link (digits only, keep country code).
function waLink(num) {
  if (!num) return null;
  const digits = String(num).replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

// ── Premium storefront header ───────────────────────────────────────
// Scroll-aware skin: over the dark cinematic hero (overHero && at top) the
// bar is transparent with light champagne text; once scrolled — or on any
// filtered view without a hero — it solidifies to ivory with dark text.
// Rows: thin gold rule · brand/contact/CTA · category nav (hover mega-menu)
// · toolbar (predictive search · filter · sort · view). Mobile collapses
// the category nav into a slide-down drawer. All behaviour preserved.
export default function StoreHeader({
  store, storeName, categories, active, onSelect,
  subCategoryMap = {}, subActive, onSelectSub,
  search, onSearch,
  sort, onSort,
  metals, metalFilter, onMetalFilter,
  viewMode, onViewMode,
  resultCount,
  onOpenOffers,
  products = [],
  reviews = [],
  overHero = false,
  onOpenProduct,
  onOpenReviews,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [hovered, setHovered] = useState(null); // category whose mega-menu is open
  const [expanded, setExpanded] = useState(null); // mobile drawer: expanded category
  const [scrolled, setScrolled] = useState(false);
  const sortRef = useRef(null);
  const hoverTimer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Track scroll so the header can transition from transparent (over hero)
  // to solid. Passive listener; reads only on rAF-free scroll ticks.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Solid whenever we're not over the hero, or the user has scrolled.
  const solid = !overHero || scrolled;

  const pick = (cat) => {
    onSelect(cat);
    setMenuOpen(false);
    setHovered(null);
  };

  const pickSub = (cat, sub) => {
    onSelectSub?.(cat, sub);
    setHovered(null);
    setMenuOpen(false);
  };

  const openMenu = (cat) => { clearTimeout(hoverTimer.current); setHovered(cat); };
  const scheduleClose = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(null), 140);
  };

  const hasFilters = !!metalFilter;
  const wa = waLink(store?.whatsapp_phone || store?.phone);
  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Sort';

  // Compute average rating from published reviews (only shown when data exists)
  const { avgRating, reviewCount } = useMemo(() => {
    const rated = reviews.filter(r => r.rating != null);
    if (rated.length === 0) return { avgRating: null, reviewCount: reviews.length };
    const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
    return { avgRating: Math.round(avg * 10) / 10, reviewCount: reviews.length };
  }, [reviews]);

  // ── Tone-aware class fragments ──
  const navIdle = solid ? 'text-ink-mid hover:bg-sand hover:text-ink' : 'text-champagne-100/80 hover:bg-white/10 hover:text-champagne-50';
  const navActive = solid ? 'bg-gold-100 text-gold-700' : 'bg-white/15 text-champagne-50';
  const toolBtn = solid
    ? 'border-line bg-white text-ink hover:border-gold-500 hover:text-gold-700'
    : 'border-champagne-300/25 bg-white/10 text-champagne-100 backdrop-blur-sm hover:border-champagne-300/60 hover:text-champagne-50';

  return (
    <header
      id="store-header"
      className={`sticky top-0 z-40 border-b transition-colors duration-500 ${
        solid
          ? 'border-line bg-cream/90 backdrop-blur-md shadow-[0_6px_20px_-16px_rgba(42,33,24,.35)]'
          : 'border-transparent bg-gradient-to-b from-noir-900/65 via-noir-900/35 to-transparent backdrop-blur-[6px]'
      }`}
      data-magnetic
    >
      <div className={`gold-rule transition-opacity duration-500 ${solid ? 'opacity-100' : 'opacity-0'}`} />

      {/* Row 1 — brand + contact */}
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <button
          className={`grid h-10 w-10 place-items-center rounded-lg transition lg:hidden ${solid ? 'text-ink hover:bg-sand' : 'text-champagne-50 hover:bg-white/10'}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <button
            className="flex items-center gap-2.5"
            onClick={() => pick(null)}
            aria-label={`${storeName} — home`}
            data-magnetic
          >
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={`${storeName} logo`}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
                <Gem size={18} strokeWidth={1.75} />
              </span>
            )}
            {store?.name_style_url ? (
              <img
                src={store.name_style_url}
                alt={storeName}
                className="h-7 sm:h-8 lg:h-9 w-auto object-contain"
              />
            ) : (
              <span className={`text-lg leading-none tracking-tight sm:text-xl lg:text-[22px] font-serif font-bold transition-colors duration-500 ${solid ? 'text-ink' : 'text-champagne-50'}`}>
                {storeName}
              </span>
            )}
          </button>
          {avgRating !== null && reviewCount > 0 && (
            <button
              type="button"
              onClick={() => { setHovered(null); onOpenReviews?.(); }}
              className="flex items-center gap-0.5 leading-none transition hover:opacity-80"
              aria-label={`${avgRating} out of 5, ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'} — view reviews`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={
                    i < Math.round(avgRating)
                      ? 'fill-gold-500 text-gold-500'
                      : solid ? 'fill-gold-200 text-gold-200' : 'fill-champagne-300/30 text-champagne-300/30'
                  }
                />
              ))}
              <span className={`text-[11px] font-medium ml-1 underline-offset-2 hover:underline ${solid ? 'text-ink-mid' : 'text-champagne-200/80'}`}>
                ({reviewCount})
              </span>
            </button>
          )}
        </div>

        {/* Contact chips — desktop only, solid header only (over hero stays clean) */}
        {solid && (
          <div className="ml-auto hidden items-center gap-1.5 lg:flex">
            {store?.address && (
              <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-sand/70 px-3 py-1.5 text-xs text-ink-mid">
                <MapPin size={13} className="shrink-0 text-gold-700" />
                <span className="truncate">{store.address}</span>
              </span>
            )}
            {store?.phone && (
              <a
                href={`tel:${String(store.phone).replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-sand/70 px-3 py-1.5 text-xs font-medium text-ink-mid transition hover:bg-sand hover:text-ink"
              >
                <Phone size={13} className="text-gold-700" />
                {store.phone}
              </a>
            )}
          </div>
        )}

        {/* WhatsApp / enquire CTA */}
        <div className={solid ? 'ml-auto lg:ml-0' : 'ml-auto'}>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_4px_14px_-2px_rgba(37,211,102,.55)] transition hover:brightness-105"
              aria-label="Chat on WhatsApp"
              data-magnetic
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.149-.149.347-.347.521-.524.173-.174.231-.297.347-.495.116-.198.058-.372-.034-.521-.092-.149-.74-1.785-.94-2.197-.231-.479-.466-.479-.652-.479-.173 0-.372-.025-.571-.025-.198 0-.521.075-.793.372-.272.297-1.04 1.016-1.04 2.479s1.064 2.876 1.213 3.074c.149.198 2.05 3.124 4.972 4.255 2.922 1.131 2.922.756 3.467.706.545-.05 1.758-.706 2.005-1.388.247-.682.247-1.265.173-1.388-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.58 1.4 5.07L2 22l5.2-1.5a9.86 9.86 0 0 0 4.84 1.26h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.09.89.89-3.01-.2-.31a8.22 8.22 0 0 1-1.27-4.37C3.88 7.4 7.55 3.73 12.05 3.73a8.18 8.18 0 0 1 5.82 2.4 8.18 8.18 0 0 1 2.41 5.78c0 4.5-3.67 8.22-8.18 8.22z"/>
              </svg>
            </a>
          ) : (
            <button onClick={onOpenOffers} className="btn-gold px-4 py-2 text-[13px]" data-magnetic>
              <Tag size={15} />
              <span className="hidden sm:inline">Offers</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2 — category nav (desktop) with hover mega-menu */}
      <nav className={`relative hidden border-t transition-colors duration-500 lg:block ${solid ? 'border-line/70' : 'border-white/10'}`} onMouseLeave={scheduleClose}>
        <div className="no-scrollbar mx-auto flex max-w-[1280px] flex-wrap items-center gap-1 px-6 py-2 lg:px-8">
          <button
            onClick={onOpenOffers}
            onMouseEnter={() => setHovered(null)}
            className="mr-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-maroon-500 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_3px_10px_rgba(126,31,48,.28)] transition hover:bg-maroon-600 hover:-translate-y-px"
            data-magnetic
          >
            <Tag size={13} /> Offers
          </button>
          <button
            onClick={() => pick(null)}
            onMouseEnter={() => setHovered(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition ${active == null ? navActive : navIdle}`}
          >
            All Jewellery
          </button>
          {categories.map(cat => {
            const subs = subCategoryMap[cat] || [];
            const hasSubs = subs.length > 0;
            const isOpen = hovered === cat;
            const total = subs.length + 1;
            const cols = Math.min(3, Math.max(1, Math.ceil(total / 2)));
            const colsClass = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3';
            return (
              <div key={cat} className="relative" onMouseEnter={() => openMenu(cat)}>
                <button
                  onClick={() => pick(cat)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition ${active === cat ? navActive : navIdle}`}
                  aria-haspopup={hasSubs || undefined}
                  aria-expanded={isOpen || undefined}
                >
                  {labelFor(cat)}
                </button>

                {/* Compact mega-menu — always light for readability */}
                {isOpen && hasSubs && (
                  <div
                    className="absolute left-0 top-[calc(100%+8px)] z-50 w-max max-w-[min(92vw,640px)] overflow-hidden rounded-2xl border border-line bg-cream shadow-[0_18px_40px_-14px_rgba(42,33,24,.4)] animate-scaleIn"
                    onMouseEnter={() => openMenu(cat)}
                    onMouseLeave={scheduleClose}
                  >
                    <div className="gold-rule opacity-70" />
                    <div className="p-3">
                      <div className="mb-2 flex items-center gap-2 px-1.5">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-100 text-gold-700">
                          <Gem size={12} />
                        </span>
                        <h3 className="font-serif text-[15px] font-bold text-ink">{labelFor(cat)}</h3>
                      </div>
                      <div className={`grid ${colsClass} gap-x-2 gap-y-0.5`}>
                        <button
                          onClick={() => pickSub(cat, null)}
                          className={`group flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-[13.5px] transition hover:bg-sand ${active === cat && subActive == null ? 'font-semibold text-gold-700' : 'text-ink'}`}
                        >
                          <ChevronRight size={13} className="shrink-0 text-gold-600 opacity-0 transition group-hover:opacity-100" />
                          All {labelFor(cat)}
                        </button>
                        {subs.map(sc => (
                          <button
                            key={sc}
                            onClick={() => pickSub(cat, sc)}
                            className={`group flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-[13.5px] transition hover:bg-sand ${active === cat && subActive === sc ? 'font-semibold text-gold-700' : 'text-ink-mid hover:text-ink'}`}
                          >
                            <ChevronRight size={13} className="shrink-0 text-gold-600 opacity-0 transition group-hover:opacity-100" />
                            {sc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Row 3 — toolbar */}
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 pb-3 pt-2 sm:px-6 lg:px-8">
        <PredictiveSearch
          value={search}
          onChange={onSearch}
          onCommit={onSearch}
          products={products}
          categories={categories}
          onSelectCategory={pick}
          onOpenProduct={onOpenProduct}
          tone={solid ? 'light' : 'dark'}
        />

        <button
          className={`relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border transition ${
            showFilters || hasFilters
              ? 'border-gold-700 bg-gold-100 text-gold-700'
              : toolBtn
          }`}
          onClick={() => setShowFilters(p => !p)}
          title="Filters"
          aria-label="Filters"
        >
          <SlidersHorizontal size={15} />
          {hasFilters && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-700" />}
        </button>

        <div className="relative shrink-0" ref={sortRef}>
          <button
            className={`flex h-[42px] items-center gap-2 rounded-xl border px-3 text-sm transition ${toolBtn}`}
            onClick={() => setSortOpen(p => !p)}
            title="Sort"
            aria-label="Sort"
          >
            <ArrowUpDown size={15} />
            <span className="hidden text-[13px] font-medium sm:inline">{sortLabel}</span>
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 flex min-w-[200px] flex-col rounded-xl border border-line bg-white p-1.5 shadow-lift animate-scaleIn">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition ${sort === opt.value ? 'bg-gold-50 font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand hover:text-ink'}`}
                  onClick={() => { onSort(opt.value); setSortOpen(false); }}
                >
                  {opt.label}
                  {sort === opt.value && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`flex shrink-0 overflow-hidden rounded-xl border ${solid ? 'border-line bg-white' : 'border-champagne-300/25 bg-white/10 backdrop-blur-sm'}`}>
          <button
            className={`grid h-[42px] w-10 place-items-center transition ${
              viewMode === 'grid' ? 'bg-gold-700 text-white' : solid ? 'text-ink-mid hover:bg-sand hover:text-ink' : 'text-champagne-100 hover:bg-white/10'
            }`}
            onClick={() => onViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={`grid h-[42px] w-10 place-items-center transition ${
              viewMode === 'list' ? 'bg-gold-700 text-white' : solid ? 'text-ink-mid hover:bg-sand hover:text-ink' : 'text-champagne-100 hover:bg-white/10'
            }`}
            onClick={() => onViewMode('list')}
            aria-label="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 pb-4 pt-1 sm:px-6 lg:px-8 animate-fadeIn">
          <div className="flex flex-col gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-luxe ${solid ? 'text-ink-mid' : 'text-champagne-200'}`}>
              <Gem size={12} /> Metal / Purity
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
                  !metalFilter ? 'border-gold-700 bg-gold-700 font-semibold text-white' : solid ? 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink' : 'border-champagne-300/25 bg-white/10 text-champagne-100'
                }`}
                onClick={() => onMetalFilter('')}
              >
                Any
              </button>
              {metals.map(m => (
                <button
                  key={m}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
                    metalFilter === m ? 'border-gold-700 bg-gold-700 font-semibold text-white' : solid ? 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink' : 'border-champagne-300/25 bg-white/10 text-champagne-100'
                  }`}
                  onClick={() => onMetalFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[13px] ${solid ? 'text-ink-mid' : 'text-champagne-200'}`}>{resultCount} item{resultCount !== 1 ? 's' : ''}</span>
            {hasFilters && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-maroon-50 px-3 py-1.5 text-[12.5px] text-maroon-600 transition hover:bg-maroon-100"
                onClick={() => onMetalFilter('')}
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile category drawer — always light for readability */}
      {menuOpen && (
        <nav className="flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto border-t border-line bg-cream px-4 py-3 sm:px-6 lg:hidden animate-fadeIn">
          {store?.address && (
            <span className="mb-1 inline-flex items-center gap-2 px-2 py-2 text-[13px] text-ink-mid">
              <MapPin size={15} className="shrink-0 text-gold-700" /> {store.address}
            </span>
          )}
          <button
            className="mb-1 inline-flex items-center gap-2 rounded-lg bg-maroon-50 px-3 py-3 text-[15px] font-semibold text-maroon-600"
            onClick={() => { onOpenOffers(); setMenuOpen(false); }}
          >
            <Tag size={16} /> Offers
          </button>
          <button
            className={`rounded-lg px-3 py-3 text-left text-[15px] transition ${active == null ? 'bg-gold-100 font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'}`}
            onClick={() => pick(null)}
          >
            All Jewellery
          </button>
          {categories.map(cat => {
            const subs = subCategoryMap[cat] || [];
            const hasSubs = subs.length > 0;
            const isExpanded = expanded === cat;
            return (
              <div key={cat}>
                <div className="flex items-center">
                  <button
                    className={`flex-1 rounded-lg px-3 py-3 text-left text-[15px] transition ${active === cat ? 'bg-gold-100 font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'}`}
                    onClick={() => pick(cat)}
                  >
                    {labelFor(cat)}
                  </button>
                  {hasSubs && (
                    <button
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-mid transition hover:bg-sand"
                      onClick={() => setExpanded(isExpanded ? null : cat)}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${labelFor(cat)}`}
                      aria-expanded={isExpanded}
                    >
                      <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {hasSubs && isExpanded && (
                  <div className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-line pl-3 animate-fadeIn">
                    <button
                      className={`rounded-lg px-3 py-2.5 text-left text-[14px] transition ${active === cat && subActive == null ? 'font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'}`}
                      onClick={() => pickSub(cat, null)}
                    >
                      All {labelFor(cat)}
                    </button>
                    {subs.map(sc => (
                      <button
                        key={sc}
                        className={`rounded-lg px-3 py-2.5 text-left text-[14px] transition ${active === cat && subActive === sc ? 'font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'}`}
                        onClick={() => pickSub(cat, sc)}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}
    </header>
  );
}
