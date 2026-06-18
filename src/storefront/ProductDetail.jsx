import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Gem } from 'lucide-react';
import { getStoreBySlug, getStorefrontProduct } from '../lib/storefront';
import ProductView from './ProductView';
import StoreFooter from './StoreFooter';
import LuxeCursor from './LuxeCursor';

// ── Product detail page (route) ─────────────────────────────────────
// Route: /store/:storeSlug/product/:productId — used for deep links and
// shared URLs. In-app navigation from the catalogue uses ProductModal
// (no route change), so this fetches the product fresh on direct load.
export default function ProductDetail() {
  const { storeSlug, productId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      try {
        const row = await getStoreBySlug(storeSlug);
        if (cancelled) return;
        if (!row) { setStatus('notfound'); return; }
        setStore(row);
        const p = await getStorefrontProduct(row.owner_id, productId);
        if (cancelled) return;
        if (!p) { setStatus('notfound'); return; }
        setProduct(p);
        setStatus('ready');
        window.scrollTo(0, 0);
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [storeSlug, productId]);

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <div className="spinner" />
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6 text-center">
        <div className="flex flex-col items-center gap-4 text-ink-mid">
          <Gem size={36} strokeWidth={1} className="text-gold-300" />
          <p>This piece is no longer available.</p>
          <Link to={`/store/${storeSlug}`} className="btn-outline"><ChevronLeft size={16} /> Back to store</Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6 text-center">
        <p className="text-ink-mid">Something went wrong. Please refresh.</p>
      </div>
    );
  }

  const storeName = store.store_name || 'Jewellery Store';

  return (
    <div className="min-h-screen bg-cream">
      <LuxeCursor />
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
        <div className="gold-rule" />
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink-mid transition hover:bg-sand hover:text-ink"
            onClick={() => navigate(`/store/${storeSlug}`)}
          >
            <ChevronLeft size={18} /> Back
          </button>
          <Link to={`/store/${storeSlug}`} className="display mx-auto text-lg sm:text-xl">{storeName}</Link>
          <span className="w-[68px]" />
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <ProductView product={product} ownerId={store.owner_id} store={store} customerName="Website Visitor" />
      </main>

      <StoreFooter store={store} storeName={storeName} onOpenOffers={() => navigate(`/store/${storeSlug}`)} />
    </div>
  );
}
