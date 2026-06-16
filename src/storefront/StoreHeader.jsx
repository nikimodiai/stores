import React, { useState, useRef, useEffect } from 'react';
import {
  Search, X, SlidersHorizontal, ArrowUpDown, LayoutGrid, List, Gem,
  Menu, Tag, MapPin, Phone, Sparkles, Check, ChevronDown, ChevronRight,
} from 'lucide-react';
import { CATEGORIES } from '../lib/config';
import { SORT_OPTIONS } from '../lib/storefront';

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
// Row 0: thin gold rule.
// Row 1: hamburger · brand · contact chips (location/call) · WhatsApp CTA.
// Row 2: category nav (offers pill + All + categories), scrollable.
// Row 3: toolbar — search · filter · sort · view toggle.
// On mobile the category nav collapses into a slide-down drawer.
export default function StoreHeader({
  store, storeName, categories, active, onSelect,
  subCategoryMap = {}, subActive, onSelectSub,
  search, onSearch,
  sort, onSort,
  metals, metalFilter, onMetalFilter,
  viewMode, onViewMode,
  resultCount,
  onOpenOffers,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [hovered, setHovered] = useState(null); // category whose mega-menu is open
  const [expanded, setExpanded] = useState(null); // mobile drawer: expanded category
  const sortRef = useRef(null);
  const hoverTimer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const pick = (cat) => {
    onSelect(cat);
    setMenuOpen(false);
    setHovered(null);
  };

  // Pick a sub-category (or "All <cat>" when sub is null) from the mega-menu.
  const pickSub = (cat, sub) => {
    onSelectSub?.(cat, sub);
    setHovered(null);
    setMenuOpen(false);
  };

  // Open a category's mega-menu on hover; close with a small delay so the
  // pointer can travel from the nav item down into the panel without flicker.
  const openMenu = (cat) => { clearTimeout(hoverTimer.current); setHovered(cat); };
  const scheduleClose = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(null), 140);
  };

  const hasFilters = !!metalFilter;
  const wa = waLink(store?.whatsapp_phone || store?.phone);
  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Sort';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md shadow-[0_6px_20px_-16px_rgba(42,33,24,.35)]">
      <div className="gold-rule" />

      {/* Row 1 — brand + contact */}
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <button
          className="grid h-10 w-10 place-items-center rounded-lg text-ink transition hover:bg-sand lg:hidden"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <button
          className="flex items-center gap-2 whitespace-nowrap"
          onClick={() => pick(null)}
          aria-label={`${storeName} — home`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
            <Gem size={18} strokeWidth={1.75} />
          </span>
          <span className="display text-lg leading-none tracking-tight sm:text-xl lg:text-[22px]">
            {storeName}
          </span>
        </button>

        {/* Contact chips — desktop only */}
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

        {/* WhatsApp / enquire CTA */}
        <div className="ml-auto lg:ml-0">
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold px-4 py-2 text-[13px]"
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline">Enquire</span>
            </a>
          ) : (
            <button onClick={onOpenOffers} className="btn-gold px-4 py-2 text-[13px]">
              <Tag size={15} />
              <span className="hidden sm:inline">Offers</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2 — category nav (desktop) with hover mega-menu */}
      <nav className="relative hidden border-t border-line/70 lg:block" onMouseLeave={scheduleClose}>
        <div className="no-scrollbar mx-auto flex max-w-[1280px] flex-wrap items-center gap-1 px-6 py-2 lg:px-8">
          <button
            onClick={onOpenOffers}
            onMouseEnter={() => setHovered(null)}
            className="mr-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-maroon-500 px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_3px_10px_rgba(126,31,48,.28)] transition hover:bg-maroon-600 hover:-translate-y-px"
          >
            <Tag size={13} /> Offers
          </button>
          <button
            onClick={() => pick(null)}
            onMouseEnter={() => setHovered(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
              active == null ? 'bg-gold-100 text-gold-700' : 'text-ink-mid hover:bg-sand hover:text-ink'
            }`}
          >
            All Jewellery
          </button>
          {categories.map(cat => {
            const subs = subCategoryMap[cat] || [];
            const hasSubs = subs.length > 0;
            const isOpen = hovered === cat;
            // Total entries = "All …" + subs. Lay out 2 per row, max 3 columns,
            // so a category with few sub-categories stays compact.
            const total = subs.length + 1;
            const cols = Math.min(3, Math.max(1, Math.ceil(total / 2)));
            const colsClass = cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3';
            return (
              <div key={cat} className="relative" onMouseEnter={() => openMenu(cat)}>
                <button
                  onClick={() => pick(cat)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                    active === cat ? 'bg-gold-100 text-gold-700' : 'text-ink-mid hover:bg-sand hover:text-ink'
                  }`}
                  aria-haspopup={hasSubs || undefined}
                  aria-expanded={isOpen || undefined}
                >
                  {labelFor(cat)}
                </button>

                {/* Compact mega-menu — anchored under this category, sized to content */}
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
                          className={`group flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-[13.5px] transition hover:bg-sand ${
                            active === cat && subActive == null ? 'font-semibold text-gold-700' : 'text-ink'
                          }`}
                        >
                          <ChevronRight size={13} className="shrink-0 text-gold-600 opacity-0 transition group-hover:opacity-100" />
                          All {labelFor(cat)}
                        </button>
                        {subs.map(sc => (
                          <button
                            key={sc}
                            onClick={() => pickSub(cat, sc)}
                            className={`group flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-[13.5px] transition hover:bg-sand ${
                              active === cat && subActive === sc ? 'font-semibold text-gold-700' : 'text-ink-mid hover:text-ink'
                            }`}
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
        <div className="relative flex flex-1 items-center">
          <Search size={15} className="pointer-events-none absolute left-3.5 text-ink-mid" />
          <input
            className="form-input w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-9 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
            placeholder="Search name, category, metal, diamond…"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 grid h-6 w-6 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink"
              onClick={() => onSearch('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          className={`relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border transition ${
            showFilters || hasFilters
              ? 'border-gold-700 bg-gold-100 text-gold-700'
              : 'border-line bg-white text-ink hover:border-gold-500 hover:text-gold-700'
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
            className="flex h-[42px] items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm text-ink transition hover:border-gold-500 hover:text-gold-700"
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
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                    sort === opt.value ? 'bg-gold-50 font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand hover:text-ink'
                  }`}
                  onClick={() => { onSort(opt.value); setSortOpen(false); }}
                >
                  {opt.label}
                  {sort === opt.value && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 overflow-hidden rounded-xl border border-line bg-white">
          <button
            className={`grid h-[42px] w-10 place-items-center transition ${
              viewMode === 'grid' ? 'bg-gold-700 text-white' : 'text-ink-mid hover:bg-sand hover:text-ink'
            }`}
            onClick={() => onViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className={`grid h-[42px] w-10 place-items-center transition ${
              viewMode === 'list' ? 'bg-gold-700 text-white' : 'text-ink-mid hover:bg-sand hover:text-ink'
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
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-luxe text-ink-mid">
              <Gem size={12} /> Metal / Purity
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
                  !metalFilter ? 'border-gold-700 bg-gold-700 font-semibold text-white' : 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink'
                }`}
                onClick={() => onMetalFilter('')}
              >
                Any
              </button>
              {metals.map(m => (
                <button
                  key={m}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
                    metalFilter === m ? 'border-gold-700 bg-gold-700 font-semibold text-white' : 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink'
                  }`}
                  onClick={() => onMetalFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-ink-mid">{resultCount} item{resultCount !== 1 ? 's' : ''}</span>
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

      {/* Mobile category drawer */}
      {menuOpen && (
        <nav className="flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto border-t border-line px-4 py-3 sm:px-6 lg:hidden animate-fadeIn">
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
            className={`rounded-lg px-3 py-3 text-left text-[15px] transition ${
              active == null ? 'bg-gold-100 font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'
            }`}
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
                    className={`flex-1 rounded-lg px-3 py-3 text-left text-[15px] transition ${
                      active === cat ? 'bg-gold-100 font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'
                    }`}
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
                      className={`rounded-lg px-3 py-2.5 text-left text-[14px] transition ${
                        active === cat && subActive == null ? 'font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'
                      }`}
                      onClick={() => pickSub(cat, null)}
                    >
                      All {labelFor(cat)}
                    </button>
                    {subs.map(sc => (
                      <button
                        key={sc}
                        className={`rounded-lg px-3 py-2.5 text-left text-[14px] transition ${
                          active === cat && subActive === sc ? 'font-semibold text-gold-700' : 'text-ink-mid hover:bg-sand'
                        }`}
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
