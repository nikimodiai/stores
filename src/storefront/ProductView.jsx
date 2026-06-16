import { useState } from 'react';
import { Sparkles, Gem, ShieldCheck, Truck, BadgeCheck, MessageCircle } from 'lucide-react';
import { productImages } from '../lib/storefront';
import TryOnModal from './TryOnModal';

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
export default function ProductView({ product, ownerId, store, customerName = 'Website Visitor' }) {
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
          {product.in_stock !== false && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <BadgeCheck size={14} /> In stock
            </span>
          )}
        </div>

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
