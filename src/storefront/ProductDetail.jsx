import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Gem } from 'lucide-react';
import { getStoreBySlug, getStorefrontProduct } from '../lib/storefront';
import ProductView from './ProductView';
import storeStyles from './Storefront.module.css';
import styles from './ProductDetail.module.css';

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
      <div className={storeStyles.page}>
        <div className={storeStyles.centerState}><div className="spinner" /></div>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className={storeStyles.page}>
        <div className={storeStyles.centerState}>
          <Gem size={36} strokeWidth={1} className={storeStyles.notFoundIcon} />
          <p>This piece is no longer available.</p>
          <Link to={`/store/${storeSlug}`} className={styles.backLink}>← Back to store</Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={storeStyles.page}>
        <div className={storeStyles.centerState}><p>Something went wrong. Please refresh.</p></div>
      </div>
    );
  }

  const storeName = store.store_name || 'Jewellery Store';

  return (
    <div className={storeStyles.page}>
      <header className={styles.miniHeader}>
        <button className={styles.backBtn} onClick={() => navigate(`/store/${storeSlug}`)}>
          <ChevronLeft size={18} /> Back
        </button>
        <Link to={`/store/${storeSlug}`} className={styles.miniBrand}>{storeName}</Link>
        <span className={styles.miniSpacer} />
      </header>

      <main className={styles.detail}>
        <ProductView product={product} ownerId={store.owner_id} customerName="Website Visitor" />
      </main>

      <footer className={storeStyles.storeFooter}>
        <span>{storeName}</span>
        <span className={storeStyles.footerDot}>·</span>
        <span>Powered by Swarnix</span>
      </footer>
    </div>
  );
}
