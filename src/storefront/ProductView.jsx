import { useState } from 'react';
import { Sparkles, Gem, ShieldCheck, Truck, BadgeCheck } from 'lucide-react';
import { productImages } from '../lib/storefront';
import TryOnModal from './TryOnModal';
import styles from './ProductDetail.module.css';

// ── Shared product view ─────────────────────────────────────────────
// The gallery + details + try-on body, reused by both the in-page modal
// (ProductModal) and the standalone route page (ProductDetail). Takes an
// already-loaded product so opening from the catalogue needs no refetch.
export default function ProductView({ product, ownerId, customerName = 'Website Visitor' }) {
  const [activeImg, setActiveImg] = useState(0);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  const urls = productImages(product);
  const priceNum = product.price != null ? Number(product.price) : null;
  const priceStr = priceNum ? '₹' + priceNum.toLocaleString('en-IN') : 'Price on request';

  const weightG = product.net_weight_grams ?? product.gold_weight_grams ?? product.metal_weight_grams ?? product.weight;
  const diamond = [
    product.diamond_purity,
    product.diamond_color,
    product.diamond_weight ? `${product.diamond_weight} ct` : null,
  ].filter(Boolean).join(' · ');

  const specGroups = [
    {
      title: 'Metal',
      rows: [
        ['Metal Type', product.metal_type],
        ['Gold Purity', product.gold_carat || product.gold_purity],
        ['Silver Purity', product.silver_purity],
        ['Weight', weightG ? `${weightG} g` : null],
      ],
    },
    {
      title: 'Diamond & Stones',
      rows: [
        ['Diamond', diamond || null],
        ['Shape', product.diamond_shape],
        ['Cut', product.diamond_cut],
        ['Count', product.diamond_count],
      ],
    },
    {
      title: 'Details',
      rows: [
        ['Category', [product.category, product.sub_category].filter(Boolean).join(' · ') || null],
        ['Collection', product.collection],
        ['Colour', product.color],
        ['Size', product.size],
        ['SKU', product.sku],
      ],
    },
  ]
    .map(g => ({ ...g, rows: g.rows.filter(([, v]) => v != null && v !== '') }))
    .filter(g => g.rows.length > 0);

  return (
    <div className={styles.detailGrid}>
      {/* ── Gallery ── */}
      <section className={styles.gallery}>
        <div className={styles.mainImgWrap}>
          {urls.length > 0 ? (
            <img src={urls[activeImg]} alt={product.name} className={styles.mainImg} draggable={false} />
          ) : (
            <div className={styles.mainImgPlaceholder}><Gem size={48} strokeWidth={1} /></div>
          )}
        </div>
        {urls.length > 1 && (
          <div className={styles.thumbRow}>
            {urls.map((u, i) => (
              <button
                key={u}
                className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={u} alt="" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Info ── */}
      <section className={styles.info}>
        {product.collection && <p className={styles.collection}>{product.collection}</p>}
        <h1 className={styles.title}>{product.name}</h1>
        {[product.category, product.sub_category].filter(Boolean).length > 0 && (
          <p className={styles.subtitle}>{[product.category, product.sub_category].filter(Boolean).join(' · ')}</p>
        )}

        <div className={styles.priceRow}>
          <span className={styles.price}>{priceStr}</span>
          {product.in_stock !== false && (
            <span className={styles.stock}><BadgeCheck size={14} /> In stock</span>
          )}
        </div>

        {/* Try-On CTA */}
        <button className={styles.tryOnBtn} onClick={() => setTryOnOpen(true)}>
          <Sparkles size={18} /> Selfie Try-On
        </button>
        <p className={styles.tryOnHint}>See how this piece looks on you — upload a selfie and we&apos;ll do the rest.</p>

        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}

        {/* Spec groups */}
        {specGroups.map(g => (
          <div key={g.title} className={styles.specGroup}>
            <h3 className={styles.specGroupTitle}>{g.title}</h3>
            <dl className={styles.specList}>
              {g.rows.map(([label, value]) => (
                <div key={label} className={styles.specRow}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        {/* Trust badges */}
        <div className={styles.trustRow}>
          <span className={styles.trustItem}><ShieldCheck size={16} /> Certified quality</span>
          <span className={styles.trustItem}><Truck size={16} /> Insured delivery</span>
          <span className={styles.trustItem}><BadgeCheck size={16} /> Best price assured</span>
        </div>
      </section>

      <TryOnModal
        open={tryOnOpen}
        ownerId={ownerId}
        product={product}
        customerName={customerName}
        onClose={() => setTryOnOpen(false)}
      />
    </div>
  );
}
