import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Gem, ShieldCheck, Truck, BadgeCheck, MessageCircle } from 'lucide-react';
import { productImages, getStorefrontProductVariants } from '../lib/storefront';
import { VARIANT_COLORS } from '../lib/config';
import TryOnModal from './TryOnModal';

function colorHex(colorName) {
  return VARIANT_COLORS.find(c => c.value === colorName)?.hex ?? null;
}

// Variant color swatch + carat/size picker — only rendered when a product
// has real variant rows. Picking a swatch/chip swaps the displayed price,
// weight, diamond specs, size and HUID to that variant's own values.
function VariantPicker({ variants, selected, onSelect }) {
  if (variants.length === 0) return null;

  const seenColors = new Set();
  const colors = variants.filter(v => {
    if (!v.color || seenColors.has(v.color)) return false;
    seenColors.add(v.color);
    return true;
  });

  // Carat/size chips for the currently-selected color (so picking a color
  // first, then a carat, mirrors how shoppers expect size pickers to work).
  const sameColor = variants.filter(v => v.color === selected?.color);
  const carats = sameColor.length > 1 ? sameColor : variants;

  return (
    <div className="mt-5 flex flex-col gap-3.5">
      {colors.length > 1 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-luxe text-ink-mid">
            Colour — <span className="font-medium text-ink">{selected?.color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map(v => {
              const hex = colorHex(v.color);
              const isActive = v.color === selected?.color;
              return (
                <button
                  key={v.color}
                  type="button"
                  onClick={() => onSelect(variants.find(x => x.color === v.color) || v)}
                  title={v.color}
                  aria-label={v.color}
                  aria-pressed={isActive}
                  className={`grid h-9 w-9 place-items-center rounded-full border-2 transition ${
                    isActive ? 'border-gold-600 shadow-gold' : 'border-line hover:border-gold-300'
                  }`}
                >
                  {hex ? (
                    <span className="h-6 w-6 rounded-full border border-black/10" style={{ background: hex }} />
                  ) : (
                    <span className="h-6 w-6 rounded-full border border-black/10 bg-gradient-to-br from-gold-300 via-stone-200 to-gold-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {carats.length > 1 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-luxe text-ink-mid">
            {carats.some(v => v.size) ? 'Carat / Size' : 'Carat'}
          </p>
          <div className="flex flex-wrap gap-2">
            {carats.map(v => {
              const isActive = v.id === selected?.id;
              const label = [v.carat, v.size].filter(Boolean).join(' · ');
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelect(v)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
                    isActive
                      ? 'border-gold-700 bg-gold-700 text-white'
                      : 'border-line text-ink-mid hover:border-gold-500 hover:text-ink'
                  }`}
                >
                  {label || '—'}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Build a wa.me link from the store phone for the "Enquire" CTA.
function waLink(num, productName) {
  if (!num) return null;
  const digits = String(num).replace(/[^\d]/g, '');
  if (!digits) return null;
  const text = encodeURIComponent(`Hi! I'm interested in "${productName}". Could you share more details?`);
  return `https://wa.me/${digits}?text=${text}`;
}

// ── Shared product view ─────────────────────────────────────────────
// The gallery + details + try-on body, reused by both the in-page modal
// (ProductModal) and the standalone route page (ProductDetail). Takes an
// already-loaded product so opening from the catalogue needs no refetch.
// The product row itself is always option #1 (the design's "default" metal/
// colour) — product_variants only holds the *additional* options. Synthesize
// a pseudo-variant from the base product's own fields so the picker offers
// every option the owner configured, not just the extras.
function baseVariant(product) {
  return {
    id: '__base__',
    carat: product.gold_carat || product.gold_purity || '',
    color: product.color || 'Yellow Gold',
    gold_purity: product.gold_purity,
    gold_weight_grams: product.gold_weight_grams,
    silver_purity: product.silver_purity,
    silver_weight_grams: null,
    gross_weight: product.weight,
    net_weight_grams: product.net_weight_grams,
    diamond_purity: product.diamond_purity,
    diamond_color: product.diamond_color,
    diamond_weight: product.diamond_weight,
    size: product.size,
    huid: product.huid,
    price: product.price,
    fixed_price: product.price,
    dynamic_price: false,
    is_in_stock: product.in_stock !== false,
    images: product.images,
    primary_image_url: product.primary_image_url,
  };
}

export default function ProductView({ product, ownerId, store, customerName = 'Website Visitor' }) {
  const [activeImg, setActiveImg] = useState(0);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const base = baseVariant(product);
    setVariants([base]);
    setSelectedVariant(base);
    (async () => {
      const rows = await getStorefrontProductVariants(product.id);
      if (cancelled) return;
      const all = [base, ...rows];
      setVariants(all);
      setSelectedVariant(all[0]);
    })();
    return () => { cancelled = true; };
  }, [product.id]);

  // Reset to the first photo whenever the shopper switches colour/carat —
  // a variant's own gallery (if it has one) starts fresh, not mid-scroll.
  useEffect(() => { setActiveImg(0); }, [selectedVariant?.id]);

  // A variant with its own photos (e.g. a colourway shot separately) shows
  // those; one with no images of its own falls back to the base product's
  // gallery, so sparse variants never render an empty frame.
  const variantUrls = selectedVariant ? productImages(selectedVariant) : [];
  const urls = variantUrls.length > 0 ? variantUrls : productImages(product);

  // Overlay the selected variant's own fields onto the base product so the
  // rest of the view (price, weight, diamond specs, size, HUID) reflects
  // whichever colour/carat the shopper picked — falls back to the base
  // product untouched when it has no variants at all.
  const effective = useMemo(() => {
    if (!selectedVariant) return product;
    const v = selectedVariant;
    return {
      ...product,
      gold_purity: v.gold_purity ?? product.gold_purity,
      gold_carat: v.carat ?? product.gold_carat,
      silver_purity: v.silver_purity ?? product.silver_purity,
      net_weight_grams: v.net_weight_grams ?? product.net_weight_grams,
      gold_weight_grams: v.gold_weight_grams ?? product.gold_weight_grams,
      weight: v.gross_weight ?? product.weight,
      diamond_purity: v.diamond_purity ?? product.diamond_purity,
      diamond_color: v.diamond_color ?? product.diamond_color,
      diamond_weight: v.diamond_weight ?? product.diamond_weight,
      color: v.color ?? product.color,
      size: v.size ?? product.size,
      huid: v.huid ?? product.huid,
      price: v.dynamic_price ? (v.price ?? product.price) : (v.fixed_price ?? v.price ?? product.price),
    };
  }, [product, selectedVariant]);

  const priceNum = effective.price != null ? Number(effective.price) : null;
  const priceStr = priceNum ? '₹' + priceNum.toLocaleString('en-IN') : 'Price on request';

  const weightG = effective.net_weight_grams ?? effective.gold_weight_grams ?? effective.metal_weight_grams ?? effective.weight;
  const diamond = [
    effective.diamond_purity,
    effective.diamond_color,
    effective.diamond_weight ? `${effective.diamond_weight} ct` : null,
  ].filter(Boolean).join(' · ');

  const specGroups = [
    {
      title: 'Metal',
      rows: [
        ['Metal Type', effective.metal_type],
        ['Gold Purity', effective.gold_carat || effective.gold_purity],
        ['Silver Purity', effective.silver_purity],
        ['Weight', weightG ? `${weightG} g` : null],
      ],
    },
    {
      title: 'Diamond & Stones',
      rows: [
        ['Diamond', diamond || null],
        ['Shape', effective.diamond_shape],
        ['Cut', effective.diamond_cut],
        ['Count', effective.diamond_count],
      ],
    },
    {
      title: 'Details',
      rows: [
        ['Category', [effective.category, effective.sub_category].filter(Boolean).join(' · ') || null],
        ['Collection', effective.collection],
        ['Colour', effective.color],
        ['Size', effective.size],
        ['HUID', effective.huid],
        ['SKU', effective.sku],
      ],
    },
  ]
    .map(g => ({ ...g, rows: g.rows.filter(([, v]) => v != null && v !== '') }))
    .filter(g => g.rows.length > 0);

  const wa = waLink(store?.whatsapp_phone || store?.phone, product.name);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* ── Gallery ── */}
      <section className="lg:sticky lg:top-6 lg:self-start">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-ivory to-sand">
          {urls.length > 0 ? (
            <img src={urls[activeImg]} alt={product.name} className="h-full w-full object-contain" draggable={false} />
          ) : (
            <div className="grid h-full w-full place-items-center text-gold-300">
              <Gem size={48} strokeWidth={1} />
            </div>
          )}
        </div>
        {urls.length > 1 && (
          <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar">
            {urls.map((u, i) => (
              <button
                key={u}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  i === activeImg ? 'border-gold-500' : 'border-line hover:border-gold-300'
                }`}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={u} alt="" className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Info ── */}
      <section className="flex flex-col">
        {product.collection && (
          <p className="text-[11px] font-bold uppercase tracking-luxe text-gold-700">{product.collection}</p>
        )}
        <h1 className="display mt-2 text-2xl leading-tight sm:text-3xl">{product.name}</h1>
        {[product.category, product.sub_category].filter(Boolean).length > 0 && (
          <p className="mt-1.5 text-sm text-ink-mid">
            {[product.category, product.sub_category].filter(Boolean).join(' · ')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-serif text-[26px] font-bold text-ink">{priceStr}</span>
          {(selectedVariant ? selectedVariant.is_in_stock : product.in_stock !== false) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <BadgeCheck size={14} /> In stock
            </span>
          )}
        </div>

        <VariantPicker variants={variants} selected={selectedVariant} onSelect={setSelectedVariant} />

        {/* CTAs */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button className="btn-gold flex-1" onClick={() => setTryOnOpen(true)}>
            <Sparkles size={18} /> Selfie Try-On
          </button>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1">
              <MessageCircle size={17} /> Enquire
            </a>
          )}
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-mid">
          See how this piece looks on you — upload a selfie and we&apos;ll do the rest.
        </p>

        {product.description && (
          <p className="mt-5 border-t border-line pt-5 text-[15px] leading-relaxed text-ink-mid">
            {product.description}
          </p>
        )}

        {/* Spec groups */}
        <div className="mt-5 flex flex-col gap-5">
          {specGroups.map(g => (
            <div key={g.title}>
              <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-luxe text-ink-mid">{g.title}</h3>
              <dl className="overflow-hidden rounded-2xl border border-line">
                {g.rows.map(([label, value], i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${
                      i % 2 ? 'bg-white' : 'bg-ivory/60'
                    }`}
                  >
                    <dt className="text-ink-mid">{label}</dt>
                    <dd className="text-right font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5 border-t border-line pt-5 text-[13px] text-ink-mid">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} className="text-gold-700" /> Certified quality</span>
          <span className="inline-flex items-center gap-1.5"><Truck size={16} className="text-gold-700" /> Insured delivery</span>
          <span className="inline-flex items-center gap-1.5"><BadgeCheck size={16} className="text-gold-700" /> Best price assured</span>
        </div>
      </section>

      <TryOnModal
        open={tryOnOpen}
        ownerId={ownerId}
        product={product}
        store={store}
        customerName={customerName}
        onClose={() => setTryOnOpen(false)}
      />
    </div>
  );
}
