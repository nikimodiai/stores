import React, { useState, useEffect, useRef } from 'react';
import { Gem } from 'lucide-react';
import { productImages } from '../lib/storefront';
import styles from './Storefront.module.css';

// Auto-rotating image. If a product has multiple images, cross-dissolves
// through them every 2.5s. All images are stacked absolutely and
// pre-rendered, so opacity transitions cause no re-fetch and no layout
// shift. A single timer per card, cleared on unmount.
function Slideshow({ urls, name, showDots }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (urls.length <= 1) return;
    timerRef.current = setInterval(
      () => setIdx(i => (i + 1) % urls.length),
      2500,
    );
    return () => clearInterval(timerRef.current);
  }, [urls.length]);

  if (urls.length === 0) {
    return (
      <div className={styles.cardImgPlaceholder}>
        <Gem size={30} strokeWidth={1} />
      </div>
    );
  }
  return (
    <>
      {urls.map((url, i) => (
        <img
          key={url}
          src={url}
          alt={i === 0 ? name : ''}
          className={styles.cardImg}
          style={{ opacity: i === idx ? 1 : 0 }}
          loading="lazy"
          draggable={false}
        />
      ))}
      {showDots && urls.length > 1 && (
        <div className={styles.cardDots} aria-hidden="true">
          {urls.map((_, i) => (
            <span key={i} className={i === idx ? styles.cardDotActive : styles.cardDot} />
          ))}
        </div>
      )}
    </>
  );
}

// One product, rendered as a grid card or a list row depending on viewMode.
export default function StoreProductCard({ product: p, viewMode = 'grid', onOpen }) {
  const urls = productImages(p);
  const open = () => onOpen?.(p);

  const priceNum = p.price != null ? Number(p.price) : null;
  const priceStr = priceNum ? '₹' + priceNum.toLocaleString('en-IN') : 'Price on request';
  const sub = [p.category, p.sub_category].filter(Boolean).join(' · ');

  // Build a label/value spec list from whatever product detail columns are
  // populated — sparse products simply show fewer rows.
  const weightG = p.net_weight_grams ?? p.gold_weight_grams ?? p.metal_weight_grams ?? p.weight;
  const diamond = [
    p.diamond_purity,
    p.diamond_color,
    p.diamond_weight ? `${p.diamond_weight} ct` : null,
  ].filter(Boolean).join(' · ');
  const specs = [
    ['Metal', p.metal_type],
    ['Gold', p.gold_carat || p.gold_purity],
    ['Silver', p.silver_purity],
    ['Colour', p.color],
    ['Diamond', diamond || null],
    ['Shape', p.diamond_shape],
    ['Weight', weightG ? `${weightG} g` : null],
    ['Size', p.size],
  ].filter(([, v]) => v != null && v !== '');

  if (viewMode === 'list') {
    return (
      <button type="button" onClick={open} className={styles.listCard}>
        <div className={styles.listImgWrap}>
          <Slideshow urls={urls} name={p.name} showDots={false} />
        </div>
        <div className={styles.listBody}>
          <h3 className={styles.cardName}>{p.name}</h3>
          {sub && <p className={styles.cardMeta}>{sub}</p>}
          {specs.length > 0 && (
            <div className={styles.listSpecs}>
              {specs.map(([label, value]) => (
                <span key={label} className={styles.listSpec}>
                  <span className={styles.listSpecLabel}>{label}:</span> {value}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={styles.listPrice}>{priceStr}</div>
      </button>
    );
  }

  return (
    <button type="button" onClick={open} className={styles.card}>
      <div className={styles.cardImgWrap}>
        <Slideshow urls={urls} name={p.name} showDots />
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{p.name}</h3>
        {sub && <p className={styles.cardMeta}>{sub}</p>}
        {specs.length > 0 && (
          <dl className={styles.specs}>
            {specs.map(([label, value]) => (
              <div key={label} className={styles.specRow}>
                <dt className={styles.specLabel}>{label}</dt>
                <dd className={styles.specValue}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className={styles.cardPrice}>{priceStr}</div>
      </div>
    </button>
  );
}
