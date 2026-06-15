import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Gem, Sparkles, X } from 'lucide-react';
import {
  getStoreBySlug,
  getStorefrontProducts,
  getStorefrontOffers,
  deriveCategories,
  deriveMetals,
  matchesSearch,
  sortProducts,
} from '../lib/storefront';
import { CATEGORIES } from '../lib/config';
import StoreHeader from './StoreHeader';
import StoreProductCard from './StoreProductCard';
import StoreNotFound from './StoreNotFound';
import StoreHero from './StoreHero';
import AiChat from './AiChat';
import styles from './Storefront.module.css';

// Canonical ordering so the nav reads like the admin app (Rings, Earrings…)
const CAT_ORDER = CATEGORIES.map(c => c.value);
const orderCategories = (cats) =>
  [...cats].sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a);
    const ib = CAT_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

// ── Storefront route container ──────────────────────────────────────
// Single source of truth for "which store am I on": the resolved `store`
// row held in state here and passed down. Data flow:
//   slug (URL) → getStoreBySlug → store row → owner_id → products.
// Search / sort / filter / view state also lives here and is applied to
// the catalogue before render (mirrors the admin Inventory toolbar).
export default function Storefront() {
  const { storeSlug } = useParams();

  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [store, setStoreRow] = useState(null);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);

  // Toolbar state
  const [active, setActive] = useState(null);     // selected category, null = All
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [metalFilter, setMetalFilter] = useState(''); // '' = Any
  const [viewMode, setViewMode] = useState('grid');    // grid | list

  // AI filter state — null means inactive, otherwise a Set<product.id>
  const [aiFilteredIds, setAiFilteredIds] = useState(null);
  const [aiLabel, setAiLabel] = useState(''); // the query that triggered it
  const catalogueRef = useRef(null);

  // Called by AiChat when the webhook returns product SKUs.
  // Builds a sku→id map from the loaded product list and returns the
  // number of matched products so AiChat can show the right count.
  const handleAiResults = useCallback((skus, queryLabel) => {
    if (!skus || skus.length === 0) {
      setAiFilteredIds(null);
      return 0;
    }

    // Build sku→product.id map (case-insensitive, trimmed)
    const skuToId = new Map();
    for (const p of products) {
      if (p.sku) skuToId.set(String(p.sku).trim().toLowerCase(), p.id);
    }

    const matched = new Set();
    for (const sku of skus) {
      const id = skuToId.get(String(sku).trim().toLowerCase());
      if (id) matched.add(id);
    }

    if (matched.size > 0) {
      setAiFilteredIds(matched);
      if (queryLabel) setAiLabel(queryLabel);
      // Scroll catalogue into view after state settles
      setTimeout(() => catalogueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } else {
      // SKUs didn't match anything in the local catalogue — clear filter
      setAiFilteredIds(null);
    }

    return matched.size; // returned to AiChat to drive the in-chat note
  }, [products]);

  const clearAiFilter = useCallback(() => {
    setAiFilteredIds(null);
    setAiLabel('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setActive(null);
    setSearch('');
    setMetalFilter('');

    (async () => {
      try {
        const row = await getStoreBySlug(storeSlug);
        if (cancelled) return;
        if (!row) {
          setStatus('notfound');
          return;
        }
        setStoreRow(row);
        const [prods, activeOffers] = await Promise.all([
          getStorefrontProducts(row.owner_id),
          getStorefrontOffers(row.owner_id)
        ]);
        if (cancelled) return;
        setProducts(prods);
        setOffers(activeOffers);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [storeSlug]);

  const categories = useMemo(
    () => orderCategories(deriveCategories(products)),
    [products],
  );
  const metals = useMemo(() => deriveMetals(products), [products]);

  // Apply AI filter first (overrides toolbar filters when active),
  // then fall through to category → metal → search → sort.
  const visible = useMemo(() => {
    let arr = products;
    if (aiFilteredIds) {
      // AI mode: show only the matched products, preserve server order
      arr = arr.filter(p => aiFilteredIds.has(p.id));
      return arr; // skip further toolbar filters so AI results are shown cleanly
    }
    if (active) arr = arr.filter(p => p.category === active);
    if (metalFilter) {
      arr = arr.filter(p =>
        p.gold_carat === metalFilter ||
        p.gold_purity === metalFilter ||
        p.silver_purity === metalFilter,
      );
    }
    arr = arr.filter(p => matchesSearch(p, search));
    return sortProducts(arr, sort);
  }, [products, aiFilteredIds, active, metalFilter, search, sort]);

  if (status === 'loading') {
    return (
      <div className={styles.centerState}>
        <div className="spinner" />
      </div>
    );
  }

  if (status === 'notfound') return <StoreNotFound slug={storeSlug} />;

  if (status === 'error') {
    return (
      <div className={styles.centerState}>
        <p>Something went wrong loading this store. Please refresh.</p>
      </div>
    );
  }

  const storeName = store.store_name || 'Jewellery Store';
  const hasQuery = search || metalFilter || active;
  const isAiFiltered = !!aiFilteredIds;

  return (
    <div className={styles.page}>
      <StoreHeader
        storeName={storeName}
        categories={categories}
        active={active}
        onSelect={setActive}
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
        metals={metals}
        metalFilter={metalFilter}
        onMetalFilter={setMetalFilter}
        viewMode={viewMode}
        onViewMode={setViewMode}
        resultCount={visible.length}
      />

      {!hasQuery && !isAiFiltered && (
        <StoreHero offers={offers} products={products} />
      )}

      <main className={styles.catalogue} ref={catalogueRef}>
        {/* ── AI Results banner ── */}
        {isAiFiltered && (
          <div className={styles.aiBanner}>
            <span className={styles.aiBannerLeft}>
              <Sparkles size={16} className={styles.aiBannerIcon} />
              <span>
                <strong>AI Suggestions</strong>
                {aiLabel ? <span className={styles.aiBannerQuery}> for "{aiLabel}"</span> : null}
                <span className={styles.aiBannerCount}> · {visible.length} {visible.length === 1 ? 'item' : 'items'}</span>
              </span>
            </span>
            <button className={styles.aiBannerClear} onClick={clearAiFilter} aria-label="Clear AI filter">
              <X size={14} />
              Show all
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <div className={styles.emptyState}>
            <Gem size={34} strokeWidth={1} className={styles.notFoundIcon} />
            <p>
              {isAiFiltered
                ? 'The AI found results — but they\'re not in the local catalogue yet.'
                : hasQuery
                  ? 'No pieces match your search.'
                  : 'This store has no products listed yet.'}
            </p>
          </div>
        ) : (
          <div className={`${viewMode === 'list' ? styles.listGrid : styles.grid} ${isAiFiltered ? styles.aiHighlightGrid : ''}`}>
            {visible.map(p => (
              <StoreProductCard key={p.id} product={p} viewMode={viewMode} />
            ))}
          </div>
        )}
      </main>

      <footer className={styles.storeFooter}>
        <span>{storeName}</span>
        <span className={styles.footerDot}>·</span>
        <span>Powered by Swarnix</span>
      </footer>

      {/* ── AI Chatbot widget ─────────────────────────────────────── */}
      <AiChat store={store} products={products} onAiResults={handleAiResults} onClearAiFilter={clearAiFilter} />
    </div>
  );
}
