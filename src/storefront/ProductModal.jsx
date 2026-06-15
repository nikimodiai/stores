import { useEffect } from 'react';
import { X } from 'lucide-react';
import ProductView from './ProductView';
import styles from './ProductModal.module.css';

// ── Product modal ───────────────────────────────────────────────────
// Opens over the catalogue (which stays mounted underneath), so closing
// is instant — no route change, no re-fetch of the product list. Takes
// the already-loaded product object straight from the card.
export default function ProductModal({ open, product, ownerId, customerName, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={product.name}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className={styles.sheetBody}>
          <ProductView product={product} ownerId={ownerId} customerName={customerName} />
        </div>
      </div>
    </div>
  );
}
