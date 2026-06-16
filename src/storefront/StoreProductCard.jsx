import React, { useState, useEffect, useRef } from 'react';
import { Gem, Sparkles } from 'lucide-react';
import { productImages } from '../lib/storefront';

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
      <div className="absolute inset-0 grid place-items-center text-gold-300">
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
          className="absolute inset-0 h-full w-full object-cover object-top transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.06]"
          style={{ opacity: i === idx ? 1 : 0 }}
          loading="lazy"
          draggable={false}
        />
      ))}
      {showDots && urls.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
          {urls.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,.25)] transition ${
                i === idx ? 'bg-white' : 'bg-white/55'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Build a label/value spec list from whatever product detail columns are
// populated — sparse products simply show fewer rows.
function buildSpecs(p) {
  const weightG = p.net_weight_grams ?? p.gold_weight_grams ?? p.metal_weight_grams ?? p.weight;
  const diamond = [
    p.diamond_purity,
    p.diamond_color,
    p.diamond_weight ? `${p.diamond_weight} ct` : null,
  ].filter(Boolean).join(' · ');
  return [
    ['Metal', p.metal_type],
    ['Gold', p.gold_carat || p.gold_purity],
    ['Silver', p.silver_purity],
    ['Colour', p.color],
    ['Diamond', diamond || null],
    ['Shape', p.diamond_shape],
    ['Weight', weightG ? `${weightG} g` : null],
    ['Size', p.size],
  ].filter(([, v]) => v != null && v !== '');
}

// One product, rendered as a grid card or a list row depending on viewMode.
export default function StoreProductCard({ product: p, viewMode = 'grid', onOpen }) {
  const urls = productImages(p);
  const open = () => onOpen?.(p);

  const priceNum = p.price != null ? Number(p.price) : null;
  const priceStr = priceNum ? '₹' + priceNum.toLocaleString('en-IN') : 'Price on request';
  const sub = [p.category, p.sub_category].filter(Boolean).join(' · ');
  const specs = buildSpecs(p);

  if (viewMode === 'list') {
    return (
      <button
        type="button"
        onClick={open}
        className="group flex w-full items-stretch gap-4 overflow-hidden rounded-2xl border border-line bg-white text-left transition hover:border-gold-200 hover:shadow-cardHov"
      >
        <div className="relative w-[100px] shrink-0 self-stretch overflow-hidden bg-sand sm:w-[120px]">
          <Slideshow urls={urls} name={p.name} showDots={false} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center py-3.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{p.name}</h3>
          {sub && <p className="mt-0.5 text-xs text-ink-mid">{sub}</p>}
          {specs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-ink sm:text-xs">
              {specs.slice(0, 5).map(([label, value]) => (
                <span key={label} className="whitespace-nowrap">
                  <span className="text-ink-mid">{label}:</span> {value}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center whitespace-nowrap px-4 font-serif text-[15px] font-bold text-gold-700 sm:px-5">
          {priceStr}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-white text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1.5 hover:border-gold-200 hover:shadow-cardHov"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-sand">
        <Slideshow urls={urls} name={p.name} showDots />
        {/* subtle sheen on hover */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col px-3.5 pb-4 pt-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{p.name}</h3>
        {sub && <p className="mt-1 text-xs text-ink-mid">{sub}</p>}
        {specs.length > 0 && (
          <dl className="mt-2.5 flex flex-col gap-1 border-t border-line pt-2.5">
            {specs.slice(0, 4).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2.5 text-xs leading-snug">
                <dt className="shrink-0 text-ink-mid">{label}</dt>
                <dd className="truncate text-right font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-serif text-[17px] font-bold tracking-tight text-ink">{priceStr}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-semibold text-gold-700 opacity-0 transition group-hover:opacity-100">
            <Sparkles size={11} /> View
          </span>
        </div>
      </div>
    </button>
  );
}
