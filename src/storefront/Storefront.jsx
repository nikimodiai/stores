import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Gem } from 'lucide-react';
import {
  getStoreBySlug,
  getStorefrontProducts,
  deriveCategories,
  deriveMetals,
  matchesSearch,
  sortProducts,
} from '../lib/storefront';
import { CATEGORIES } from '../lib/config';
import StoreHeader from './StoreHeader';
import StoreProductCard from './StoreProductCard';
import StoreNotFound from './StoreNotFound';
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

  // Toolbar state
  const [active, setActive] = useState(null);     // selected category, null = All
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [metalFilter, setMetalFilter] = useState(''); // '' = Any
  const [viewMode, setViewMode] = useState('grid');    // grid | list

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
        const prods = await getStorefrontProducts(row.owner_id);
        if (cancelled) return;
        setProducts(prods);
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

  // Apply category → metal → search → sort, in that order.
  const visible = useMemo(() => {
    let arr = products;
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
  }, [products, active, metalFilter, search, sort]);

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

      <main className={styles.catalogue}>
        {visible.length === 0 ? (
          <div className={styles.emptyState}>
            <Gem size={34} strokeWidth={1} className={styles.notFoundIcon} />
            <p>
              {hasQuery
                ? 'No pieces match your search.'
                : 'This store has no products listed yet.'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'list' ? styles.listGrid : styles.grid}>
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
    </div>
  );
}
