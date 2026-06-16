import { useEffect } from 'react';
import { X } from 'lucide-react';
import ProductView from './ProductView';

// ── Product modal ───────────────────────────────────────────────────
// Opens over the catalogue (which stays mounted underneath), so closing
// is instant — no route change, no re-fetch of the product list. Takes
// the already-loaded product object straight from the card.
export default function ProductModal({ open, product, ownerId, store, customerName, onClose }) {
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
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/45 p-3 backdrop-blur-sm sm:p-6 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="relative my-2 w-full max-w-5xl rounded-3xl border border-line bg-cream shadow-[0_30px_80px_-20px_rgba(42,33,24,.5)] animate-scaleIn sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-card backdrop-blur transition hover:bg-white hover:text-gold-700"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="p-5 sm:p-8 lg:p-10">
          <ProductView product={product} ownerId={ownerId} store={store} customerName={customerName} />
        </div>
      </div>
    </div>
  );
}
