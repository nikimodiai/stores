import { Gem, MapPin, Phone, MessageCircle, ShieldCheck, Sparkles, Tag } from 'lucide-react';

// Normalise a phone number into a wa.me link (digits only).
function waLink(num) {
  if (!num) return null;
  const digits = String(num).replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

// ── Premium shared footer ───────────────────────────────────────────
// Used by both the storefront home and the product-detail page. Shows a
// brand block, contact details (pulled from the resolved store row), a
// trust strip, and the "Powered by Swarnix" credit. Pure presentation —
// every field is optional so sparse stores degrade gracefully.
export default function StoreFooter({ store, storeName, onOpenOffers }) {
  const wa = waLink(store?.whatsapp_phone || store?.phone);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-cream-fade">
      {/* Trust strip */}
      <div className="border-b border-line/70">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-3 px-6 py-7 sm:grid-cols-3 lg:px-8">
          {[
            [ShieldCheck, 'Certified Quality', 'Hallmarked & assured'],
            [Sparkles, 'AI Selfie Try-On', 'See it on you, instantly'],
            [Tag, 'Best Price Assured', 'Fair, transparent pricing'],
          ].map(([Icon, title, sub]) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-700">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-xs text-ink-mid">{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
              <Gem size={18} strokeWidth={1.75} />
            </span>
            <span className="display text-xl">{storeName}</span>
          </div>
          <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-ink-mid">
            Handcrafted gold, diamond and silver jewellery — fairly priced and made to be treasured.
            Browse the collection and try pieces on with our AI Selfie Try-On.
          </p>
        </div>

        {/* Visit us */}
        <div>
          <h3 className="kicker mb-4">Visit Us</h3>
          <ul className="flex flex-col gap-3 text-sm text-ink-mid">
            {store?.address && (
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold-700" />
                <span>{store.address}</span>
              </li>
            )}
            {store?.phone && (
              <li>
                <a
                  href={`tel:${String(store.phone).replace(/[^\d+]/g, '')}`}
                  className="flex items-center gap-2.5 transition hover:text-ink"
                >
                  <Phone size={16} className="shrink-0 text-gold-700" /> {store.phone}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 transition hover:text-ink"
                >
                  <MessageCircle size={16} className="shrink-0 text-gold-700" /> Chat on WhatsApp
                </a>
              </li>
            )}
            {!store?.address && !store?.phone && !wa && (
              <li className="text-ink-soft">Contact details coming soon.</li>
            )}
          </ul>
        </div>

        {/* Explore */}
        <div>
          <h3 className="kicker mb-4">Explore</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-ink-mid">
            <li>
              <button onClick={onOpenOffers} className="transition hover:text-ink">Current Offers</button>
            </li>
            <li><span className="text-ink-soft">Gold · Diamond · Silver</span></li>
            <li><span className="text-ink-soft">AI Selfie Try-On</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line/70">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-ink-mid sm:flex-row lg:px-8">
          <span>© {year} {storeName}. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            Powered by
            <span className="inline-flex items-center gap-1 font-semibold text-gold-700">
              <Gem size={12} /> Swarnix
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
