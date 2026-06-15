import { useEffect, useState } from 'react';
import { X, Tag, BadgeCheck } from 'lucide-react';
import styles from './OffersModal.module.css';

// ── Offers modal ────────────────────────────────────────────────────
// Opened from the "Offers" nav tab. Shows the store's current, valid
// offers (already filtered by owner_id + is_active + valid_to in
// getStorefrontOffers). When there are none, shows a friendly fallback
// reassuring the customer that prices are still the best in the industry.
export default function OffersModal({ open, offers = [], storeName, onClose }) {
  // The image URL currently shown maximised (null = lightbox closed).
  const [zoomedUrl, setZoomedUrl] = useState(null);

  // Close on Escape; lock body scroll while open.
  // Escape closes the lightbox first, then the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setZoomedUrl(prev => {
        if (prev) return null; // close lightbox first
        onClose();
        return null;
      });
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Reset zoom whenever the modal itself is closed/reopened.
  useEffect(() => {
    if (!open) setZoomedUrl(null);
  }, [open]);

  if (!open) return null;

  const hasOffers = offers.length > 0;

  // Format valid_to (YYYY-MM-DD) as a readable date.
  const fmtDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="Current offers">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <div className={styles.headTitle}>
            <Tag size={18} className={styles.headIcon} />
            <h2>Current Offers</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          {hasOffers ? (
            <ul className={styles.list}>
              {offers.map((o) => {
                const validTo = fmtDate(o.valid_to);
                return (
                  <li key={o.id} className={styles.card}>
                    {o.media_type === 'image' && o.media_url && (
                      <button
                        type="button"
                        className={styles.imgWrap}
                        onClick={() => setZoomedUrl(o.media_url)}
                        aria-label={`View ${o.title} image`}
                      >
                        <img src={o.media_url} alt={o.title} className={styles.img} draggable={false} />
                      </button>
                    )}
                    <div className={styles.cardBody}>
                      <h3 className={styles.offerTitle}>{o.title}</h3>
                      {o.description && <p className={styles.offerDesc}>{o.description}</p>}
                      {validTo && (
                        <span className={styles.validTo}>Valid till {validTo}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}>
              <BadgeCheck size={40} strokeWidth={1.5} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No offers running right now</p>
              <p className={styles.emptyText}>
                We&apos;re not running any special offers at the moment — but rest assured,
                {storeName ? ` ${storeName}'s` : ' our'} prices are among the best in the
                industry. Every piece is fairly priced, every day.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Maximised image lightbox */}
      {zoomedUrl && (
        <div
          className={styles.lightbox}
          onClick={(e) => { e.stopPropagation(); setZoomedUrl(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Offer image"
        >
          <button
            className={styles.lightboxClose}
            onClick={(e) => { e.stopPropagation(); setZoomedUrl(null); }}
            aria-label="Close image"
          >
            <X size={22} />
          </button>
          <img
            src={zoomedUrl}
            alt=""
            className={styles.lightboxImg}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
