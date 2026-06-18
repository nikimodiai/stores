import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, CornerDownLeft, Gem } from 'lucide-react';
import { CATEGORIES } from '../lib/config';
import { matchesSearch, productImages } from '../lib/storefront';

const LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
const labelFor = (cat) => LABELS[cat] || cat;

const RECENT_KEY = 'swarnix:recent-search';
const MAX_RECENT = 6;

function loadRecent() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(Boolean).slice(0, MAX_RECENT) : [];
  } catch { return []; }
}
function saveRecent(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch { /* ignore */ }
}

// ── Luxury predictive search ─────────────────────────────────────────
// A focused search field with an instant suggestion panel:
//   • typing → matching products (with thumbnail) + matching categories
//   • empty  → Recent searches (localStorage) + Popular searches (derived
//              from the store's largest categories — no hard-coding)
// Fully keyboard-navigable (↑/↓/Enter/Esc). Drives existing storefront
// state via callbacks; never holds the catalogue's source of truth.
export default function PredictiveSearch({
  value,
  onChange,
  products = [],
  categories = [],
  onSelectCategory,
  onOpenProduct,
  onCommit,           // commit a free-text search (string)
  tone = 'light',     // 'light' (on cream) | 'dark' (over hero)
  placeholder = 'Search name, category, metal, diamond…',
}) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const [hi, setHi] = useState(-1); // highlighted option index
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setRecent(loadRecent()); }, []);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = (value || '').trim();

  // Popular searches: the store's biggest categories, by product count.
  const popular = useMemo(() => {
    const counts = {};
    for (const p of products) if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    return categories
      .filter(c => counts[c])
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 5);
  }, [products, categories]);

  // Live matches while typing.
  const productHits = useMemo(() => {
    if (!q) return [];
    return products.filter(p => matchesSearch(p, q)).slice(0, 6);
  }, [products, q]);

  const categoryHits = useMemo(() => {
    if (!q) return [];
    const lower = q.toLowerCase();
    return categories.filter(c => labelFor(c).toLowerCase().includes(lower) || c.toLowerCase().includes(lower)).slice(0, 4);
  }, [categories, q]);

  // Flatten the visible options into one ordered list for keyboard nav.
  // Each option: { type, payload, run() }
  const options = useMemo(() => {
    const opts = [];
    if (q) {
      opts.push({ type: 'commit', label: q, run: () => commit(q) });
      for (const c of categoryHits) opts.push({ type: 'category', label: labelFor(c), run: () => pickCategory(c) });
      for (const p of productHits) opts.push({ type: 'product', label: p.name, run: () => pickProduct(p) });
    } else {
      for (const r of recent) opts.push({ type: 'recent', label: r, run: () => commit(r) });
      for (const c of popular) opts.push({ type: 'category', label: labelFor(c), run: () => pickCategory(c) });
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryHits, productHits, recent, popular]);

  const rememberRecent = useCallback((term) => {
    const t = String(term || '').trim();
    if (!t) return;
    setRecent(prev => {
      const next = [t, ...prev.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  function commit(term) {
    onCommit?.(term);
    onChange?.(term);
    rememberRecent(term);
    setOpen(false);
    setHi(-1);
    inputRef.current?.blur();
  }
  function pickCategory(cat) {
    onChange?.('');
    onSelectCategory?.(cat);
    setOpen(false);
    setHi(-1);
    inputRef.current?.blur();
  }
  function pickProduct(p) {
    rememberRecent(p.name);
    onOpenProduct?.(p);
    setOpen(false);
    setHi(-1);
    inputRef.current?.blur();
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setHi(-1); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi(i => Math.min(i + 1, options.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(i - 1, -1)); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (hi >= 0 && options[hi]) options[hi].run();
      else if (q) commit(q);
    }
  };

  const clearRecent = () => { saveRecent([]); setRecent([]); };

  const dark = tone === 'dark';
  const inputCls = dark
    ? 'w-full rounded-full border border-champagne-300/25 bg-white/10 py-2.5 pl-10 pr-9 text-sm text-champagne-50 outline-none backdrop-blur-sm transition placeholder:text-champagne-100/50 focus:border-champagne-300/60 focus:bg-white/15'
    : 'w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-9 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15';
  const iconCls = dark ? 'text-champagne-100/70' : 'text-ink-mid';

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="relative flex items-center">
        <Search size={15} className={`pointer-events-none absolute left-3.5 ${iconCls}`} />
        <input
          ref={inputRef}
          type="search"
          className={`form-input ${inputCls}`}
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange?.(e.target.value); setOpen(true); setHi(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="predictive-list"
        />
        {value && (
          <button
            className={`absolute right-2.5 grid h-6 w-6 place-items-center rounded-full transition ${dark ? 'text-champagne-100/70 hover:bg-white/10' : 'text-ink-mid hover:bg-sand hover:text-ink'}`}
            onClick={() => { onChange?.(''); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (options.length > 0 || q) && (
        <div
          id="predictive-list"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-[0_24px_60px_-18px_rgba(42,33,24,.45)] animate-scaleIn"
        >
          {!q && recent.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-luxe text-ink-soft">
                  <Clock size={12} /> Recent
                </span>
                <button onClick={clearRecent} className="text-[11px] font-medium text-ink-soft transition hover:text-gold-700">Clear</button>
              </div>
            </div>
          )}

          {!q && popular.length > 0 && recent.length === 0 && (
            <div className="px-2.5 py-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-luxe text-ink-soft">
                <TrendingUp size={12} /> Popular
              </span>
            </div>
          )}

          {options.map((opt, i) => {
            const active = i === hi;
            const base = `flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${active ? 'bg-gold-50' : 'hover:bg-sand'}`;
            if (opt.type === 'product') {
              const p = productHits.find(x => x.name === opt.label);
              const img = p ? productImages(p)[0] : null;
              return (
                <button key={`p-${i}`} role="option" aria-selected={active} className={base} onMouseEnter={() => setHi(i)} onClick={opt.run}>
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {img ? <img src={img} alt="" className="h-full w-full object-cover" draggable={false} /> : <span className="grid h-full w-full place-items-center text-gold-300"><Gem size={15} /></span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{opt.label}</span>
                    <span className="block truncate text-[11.5px] text-ink-mid">{[p?.category, p?.sub_category].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              );
            }
            const Icon = opt.type === 'recent' ? Clock : opt.type === 'commit' ? Search : TrendingUp;
            return (
              <button key={`o-${i}`} role="option" aria-selected={active} className={base} onMouseEnter={() => setHi(i)} onClick={opt.run}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand text-gold-700">
                  <Icon size={15} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                  {opt.type === 'commit' ? <>Search for <span className="font-semibold">“{opt.label}”</span></>
                    : opt.type === 'category' ? <>{opt.label} <span className="text-ink-soft">· Category</span></>
                    : opt.label}
                </span>
                {opt.type === 'commit' && <CornerDownLeft size={14} className="shrink-0 text-ink-soft" />}
              </button>
            );
          })}

          {q && options.length === 1 && (
            <p className="px-3 py-3 text-center text-[12.5px] text-ink-mid">Press Enter to search the catalogue.</p>
          )}
        </div>
      )}
    </div>
  );
}
