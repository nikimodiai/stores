import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Gem, Sparkles, X, ArrowRight } from 'lucide-react';
import {
  getStoreBySlug,
  getStorefrontProducts,
  getStorefrontOffers,
  getStorefrontReviews,
  deriveCategories,
  deriveSubCategories,
  deriveSubCategoryMap,
  subCategoryOf,
  deriveMetals,
  matchesSearch,
  sortProducts,
  latestProducts,
  productImages,
} from '../lib/storefront';

// How many catalogue cards to reveal per "page" (infinite scroll).
const PAGE_SIZE = 24;
import { CATEGORIES } from '../lib/config';
import StoreHeader from './StoreHeader';
import StoreProductCard from './StoreProductCard';
import StoreNotFound from './StoreNotFound';
import StoreHero from './StoreHero';
import StoreFooter from './StoreFooter';
import CategoryRail from './CategoryRail';
import QuickLinks from './QuickLinks';
import FeaturedBand from './FeaturedBand';
import TrustSection from './TrustSection';
import OffersModal from './OffersModal';
import ProductModal from './ProductModal';
import AiChat from './AiChat';
import LuxeCursor from './LuxeCursor';
import Reveal from './Reveal';

// Canonical ordering so the nav reads like the admin app (Rings, Earrings…)
const CAT_ORDER = CATEGORIES.map(c => c.value);
const orderCategories = (cats) =>
  [...cats].sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a);
    const ib = CAT_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

// Reusable section heading (kicker + serif title + optional sub).
function SectionHead({ kicker, title, sub }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
      <div>
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h2 className="editorial text-[clamp(1.7rem,3.6vw,2.5rem)]">{title}</h2>
      </div>
      {sub && <p className="text-[12.5px] uppercase tracking-luxe text-ink-soft">{sub}</p>}
    </div>
  );
}

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
  const [reviews, setReviews] = useState([]);

  // Toolbar state
  const [active, setActive] = useState(null);     // selected category, null = All
  const [subActive, setSubActive] = useState(null); // selected sub-category, null = All
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [metalFilter, setMetalFilter] = useState(''); // '' = Any
  const [viewMode, setViewMode] = useState('grid');    // grid | list
  const [offersOpen, setOffersOpen] = useState(false); // offers modal
  const [selectedProduct, setSelectedProduct] = useState(null); // product detail modal
  const [shownCount, setShownCount] = useState(PAGE_SIZE); // infinite-scroll window

  // AI filter state — null means inactive, otherwise a Set<product.id>
  const [aiFilteredIds, setAiFilteredIds] = useState(null);
  const [aiLabel, setAiLabel] = useState(''); // the query that triggered it
  const catalogueRef = useRef(null);
  const latestRef = useRef(null);        // "Latest Arrivals" section (New Arrivals shortcut)
  const reviewsRef = useRef(null);       // Trust/reviews section (header rating shortcut)
  const sentinelRef = useRef(null); // infinite-scroll trigger element

  const scrollToCatalogue = useCallback(() => {
    catalogueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Reviews only render on the unfiltered home view — clear any active
  // filter first so the section is guaranteed to be mounted to scroll to.
  const scrollToReviews = useCallback(() => {
    setActive(null);
    setSubActive(null);
    setSearch('');
    setMetalFilter('');
    setAiFilteredIds(null);
    setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, []);

  // "New Arrivals" quick link → scroll to Latest Arrivals (or catalogue).
  const scrollToLatest = useCallback(() => {
    (latestRef.current || catalogueRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // A quick-link "type" search (Gold/Diamond/Bridal): set search + jump to grid.
  const searchAndScroll = useCallback((q) => {
    setActive(null);
    setSubActive(null);
    setSearch(q);
    setTimeout(() => catalogueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, []);

  // Selecting a category always resets the sub-category back to "All".
  const selectCategory = useCallback((cat) => {
    setActive(cat);
    setSubActive(null);
  }, []);

  // Pick a category + sub-category together (from the header mega-menu).
  // Passing sub=null means "All <category>".
  const selectCategorySub = useCallback((cat, sub) => {
    setActive(cat);
    setSubActive(sub ?? null);
  }, []);

  // Called by AiChat when the webhook returns product SKUs.
  const handleAiResults = useCallback((skus, queryLabel) => {
    if (!skus || skus.length === 0) {
      setAiFilteredIds(null);
      return 0;
    }
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
      setTimeout(() => catalogueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } else {
      setAiFilteredIds(null);
    }
    return matched.size;
  }, [products]);

  const clearAiFilter = useCallback(() => {
    setAiFilteredIds(null);
    setAiLabel('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setActive(null);
    setSubActive(null);
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
        const [prods, activeOffers, publishedReviews] = await Promise.all([
          getStorefrontProducts(row.owner_id),
          getStorefrontOffers(row.owner_id),
          getStorefrontReviews(row.owner_id),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setOffers(activeOffers);
        setReviews(publishedReviews);
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
  const latest = useMemo(() => latestProducts(products, 8), [products]);
  // A single hero-grade piece for the asymmetrical editorial band — prefer
  // one with an image so the composition never renders an empty frame.
  const featuredPiece = useMemo(
    () => latest.find(p => productImages(p).length > 0) || null,
    [latest],
  );
  // category → [sub-categories] for the header's hover mega-menu.
  const subCategoryMap = useMemo(() => deriveSubCategoryMap(products), [products]);
  // Sub-categories within the active category (empty when no category picked).
  const subCategories = useMemo(
    () => deriveSubCategories(products, active),
    [products, active],
  );

  // Apply AI filter first (overrides toolbar filters when active),
  // then fall through to category → sub-category → metal → search → sort.
  const visible = useMemo(() => {
    let arr = products;
    if (aiFilteredIds) {
      arr = arr.filter(p => aiFilteredIds.has(p.id));
      return arr;
    }
    if (active) arr = arr.filter(p => p.category === active);
    if (active && subActive) arr = arr.filter(p => subCategoryOf(p) === subActive);
    if (metalFilter) {
      arr = arr.filter(p =>
        p.gold_carat === metalFilter ||
        p.gold_purity === metalFilter ||
        p.silver_purity === metalFilter,
      );
    }
    arr = arr.filter(p => matchesSearch(p, search));
    return sortProducts(arr, sort);
  }, [products, aiFilteredIds, active, subActive, metalFilter, search, sort]);

  // ── Infinite scroll ───────────────────────────────────────────────
  // Reveal PAGE_SIZE cards at a time. Reset the window whenever the
  // filtered result set changes (new category/search/sort/AI filter), so
  // the customer always starts at the top of a fresh result list.
  useEffect(() => { setShownCount(PAGE_SIZE); }, [active, subActive, metalFilter, search, sort, aiFilteredIds]);

  const shown = useMemo(() => visible.slice(0, shownCount), [visible, shownCount]);
  const hasMore = shownCount < visible.length;

  // Auto-load the next page when the sentinel scrolls into view.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShownCount(c => c + PAGE_SIZE);
        }
      },
      { rootMargin: '600px 0px' }, // prefetch a screen early for a seamless feel
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown.length]);

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-sm text-ink-mid">Loading the collection…</p>
        </div>
      </div>
    );
  }

  if (status === 'notfound') return <StoreNotFound slug={storeSlug} />;

  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6 text-center">
        <div className="flex flex-col items-center gap-3 text-ink-mid">
          <Gem size={36} strokeWidth={1} className="text-gold-300" />
          <p>Something went wrong loading this store. Please refresh.</p>
        </div>
      </div>
    );
  }

  const storeName = store.store_name || 'Jewellery Store';
  const hasQuery = search || metalFilter || active;
  const isAiFiltered = !!aiFilteredIds;
  const isHome = !hasQuery && !isAiFiltered;

  return (
    <div className="min-h-screen bg-cream">
      <LuxeCursor />
      <StoreHeader
        store={store}
        storeName={storeName}
        categories={categories}
        active={active}
        onSelect={selectCategory}
        subCategoryMap={subCategoryMap}
        subActive={subActive}
        onSelectSub={selectCategorySub}
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
        onOpenOffers={() => setOffersOpen(true)}
        products={products}
        reviews={reviews}
        overHero={isHome}
        onOpenProduct={setSelectedProduct}
        onOpenReviews={scrollToReviews}
      />

      <OffersModal
        open={offersOpen}
        offers={offers}
        storeName={storeName}
        onClose={() => setOffersOpen(false)}
      />

      <ProductModal
        open={!!selectedProduct}
        product={selectedProduct}
        ownerId={store.owner_id}
        store={store}
        customerName="Website Visitor"
        onClose={() => setSelectedProduct(null)}
      />

      {/* ── Hero — only on the unfiltered home view ──
          Pulled up under the sticky header (header heights ≈ 116px mobile /
          156px desktop) so the transparent header overlays the cinematic
          hero rather than sitting on cream above it. */}
      {isHome && (
        <div className="-mt-[120px] lg:-mt-[160px]">
          <StoreHero
            storeName={storeName}
            products={latest}
            offers={offers}
            productCount={products.length}
            onExplore={scrollToCatalogue}
            onOpenOffers={() => setOffersOpen(true)}
            onTryOn={(p) => setSelectedProduct(p || latest[0] || null)}
          />
        </div>
      )}

      {/* ── Quick links rail ── */}
      {isHome && (
        <QuickLinks
          categories={categories}
          active={active}
          onSelectCategory={(cat) => { selectCategory(cat); scrollToCatalogue(); }}
          onSearch={searchAndScroll}
          onScrollLatest={scrollToLatest}
          hasLatest={latest.length > 0}
        />
      )}

      {/* ── Shop by Category ── */}
      {isHome && (
        <CategoryRail
          products={products}
          categories={categories}
          active={active}
          onSelect={selectCategory}
        />
      )}

      {/* ── Featured / Signature editorial band ── */}
      {isHome && featuredPiece && (
        <FeaturedBand product={featuredPiece} onOpen={setSelectedProduct} />
      )}

      {/* ── Latest Arrivals ── */}
      {isHome && latest.length > 0 && (
        <section ref={latestRef} className="mx-auto mt-14 max-w-[1280px] scroll-mt-24 rounded-3xl border border-gold-100 bg-cream-fade px-4 py-12 sm:px-6 lg:px-8">
          <SectionHead kicker="Just In" title="Latest Arrivals" sub="Our freshest pieces, hand-picked for you" />
          <Reveal stagger className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {latest.map(p => (
              <Reveal item key={p.id}>
                <StoreProductCard product={p} viewMode="grid" onOpen={setSelectedProduct} />
              </Reveal>
            ))}
          </Reveal>
        </section>
      )}

      {/* ── Craftsmanship & reviews ── */}
      {isHome && (
        <div ref={reviewsRef} className="scroll-mt-24">
          <TrustSection store={store} storeName={storeName} reviews={reviews} />
        </div>
      )}

      <main ref={catalogueRef} className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
        {/* Full catalogue heading on the unfiltered home view */}
        {isHome && (
          <SectionHead kicker="Explore" title="All Jewellery" sub={`${visible.length} piece${visible.length === 1 ? '' : 's'}`} />
        )}

        {/* Active-filter heading (category/search) for context */}
        {!isHome && !isAiFiltered && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-xl sm:text-2xl">
              {active ? active : search ? 'Search results' : 'Filtered pieces'}
            </h2>
            <span className="text-[13px] text-ink-mid">{visible.length} piece{visible.length === 1 ? '' : 's'}</span>
          </div>
        )}

        {/* ── Sub-category filter row (only inside a category, >1 bucket) ── */}
        {active && !isAiFiltered && subCategories.length > 1 && (
          <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSubActive(null)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] transition ${
                subActive == null
                  ? 'border-gold-700 bg-gold-700 font-semibold text-white'
                  : 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink'
              }`}
            >
              All
            </button>
            {subCategories.map(sc => (
              <button
                key={sc}
                onClick={() => setSubActive(sc)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] transition ${
                  subActive === sc
                    ? 'border-gold-700 bg-gold-700 font-semibold text-white'
                    : 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        )}

        {/* ── AI Results banner ── */}
        {isAiFiltered && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-cream px-4 py-3 animate-bannerSlide">
            <span className="flex items-center gap-2.5 text-sm text-ink">
              <Sparkles size={16} className="shrink-0 text-gold-700" />
              <span>
                <strong>AI Suggestions</strong>
                {aiLabel ? <span className="italic text-gold-700"> for “{aiLabel}”</span> : null}
                <span className="text-ink-mid"> · {visible.length} {visible.length === 1 ? 'item' : 'items'}</span>
              </span>
            </span>
            <button
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-mid transition hover:border-gold-500 hover:text-gold-700"
              onClick={clearAiFilter}
              aria-label="Clear AI filter"
            >
              <X size={14} /> Show all
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="grid min-h-[42vh] place-items-center px-6 text-center">
            <div className="flex max-w-md flex-col items-center gap-4 text-ink-mid">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-50 text-gold-300">
                <Gem size={32} strokeWidth={1} />
              </span>
              <p className="text-base">
                {isAiFiltered
                  ? "The AI found results — but they're not in the local catalogue yet."
                  : hasQuery
                    ? 'No pieces match your search.'
                    : 'This store has no products listed yet.'}
              </p>
              {hasQuery && !isAiFiltered && (
                <button
                  onClick={() => { setActive(null); setSubActive(null); setSearch(''); setMetalFilter(''); }}
                  className="btn-outline"
                >
                  Clear filters <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <Reveal
              stagger
              gap={0.04}
              key={viewMode}
              className={
                viewMode === 'list'
                  ? 'flex flex-col gap-3'
                  : 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4'
              }
            >
              {shown.map(p => (
                <Reveal item key={p.id} className={isAiFiltered ? 'rounded-2xl ring-2 ring-gold-300/50' : ''}>
                  <StoreProductCard product={p} viewMode={viewMode} onOpen={setSelectedProduct} />
                </Reveal>
              ))}
            </Reveal>

            {/* Infinite-scroll sentinel + manual fallback */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-10 flex flex-col items-center gap-4">
                <div className="spinner" aria-hidden="true" />
                <button onClick={() => setShownCount(c => c + PAGE_SIZE)} className="btn-outline">
                  Load more <ArrowRight size={16} />
                </button>
                <span className="text-[13px] text-ink-mid">
                  Showing {shown.length} of {visible.length}
                </span>
              </div>
            )}
            {!hasMore && visible.length > PAGE_SIZE && (
              <p className="mt-10 text-center text-[13px] text-ink-mid">
                You&apos;ve seen all {visible.length} pieces.
              </p>
            )}
          </>
        )}
      </main>

      <StoreFooter store={store} storeName={storeName} onOpenOffers={() => setOffersOpen(true)} />

      {/* ── AI Chatbot widget ── */}
      <AiChat store={store} products={products} onAiResults={handleAiResults} onClearAiFilter={clearAiFilter} />
    </div>
  );
}
