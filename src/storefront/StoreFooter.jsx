import { Gem, MapPin, Phone, MessageCircle, ShieldCheck, Sparkles, Tag, Instagram, Facebook, Youtube } from 'lucide-react';
import Reveal from './Reveal';

// Normalise a phone number into a wa.me link (digits only).
function waLink(num) {
  if (!num) return null;
  const digits = String(num).replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

// Social links are rendered ONLY when the store row actually carries them,
// so we never show dead/placeholder icons. Future-proofed against several
// likely column names.
function socialLinks(store) {
  if (!store) return [];
  const out = [];
  const ig = store.instagram || store.instagram_url;
  const fb = store.facebook || store.facebook_url;
  const yt = store.youtube || store.youtube_url;
  if (ig) out.push({ Icon: Instagram, href: ig, label: 'Instagram' });
  if (fb) out.push({ Icon: Facebook, href: fb, label: 'Facebook' });
  if (yt) out.push({ Icon: Youtube, href: yt, label: 'YouTube' });
  return out;
}

// ── Premium dark editorial footer ───────────────────────────────────
// Cinematic noir close to the page (matches the hero "frame"). Brand block,
// contact details (from the resolved store row), trust strip, optional
// socials, and the "Powered by Swarnix" credit. Pure presentation — every
// field is optional so sparse stores degrade gracefully.
export default function StoreFooter({ store, storeName, onOpenOffers }) {
  const wa = waLink(store?.whatsapp_phone || store?.phone);
  const year = new Date().getFullYear();
  const socials = socialLinks(store);

  return (
    <footer className="mt-24 bg-noir-fade text-champagne-100">
      <div className="gold-rule opacity-80" />

      {/* Trust strip */}
      <div className="border-b border-white/10">
        <Reveal
          stagger
          gap={0.08}
          className="mx-auto grid max-w-[1280px] grid-cols-1 gap-3 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8"
        >
          {[
            [ShieldCheck, 'Certified Quality', 'Hallmarked & assured'],
            [Sparkles, 'AI Selfie Try-On', 'See it on you, instantly'],
            [Tag, 'Best Price Assured', 'Fair, transparent pricing'],
          ].map(([Icon, title, sub]) => (
            <Reveal item key={title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold-400/20 bg-white/5 text-gold-300">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-champagne-50">{title}</span>
                <span className="block text-xs text-champagne-100/60">{sub}</span>
              </span>
            </Reveal>
          ))}
        </Reveal>
      </div>

      {/* Main */}
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
              <Gem size={18} strokeWidth={1.75} />
            </span>
            <span className="font-display text-2xl font-semibold text-champagne-50">{storeName}</span>
          </div>
          <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-champagne-100/65">
            Handcrafted gold, diamond and silver jewellery — fairly priced and made to be treasured.
            Browse the collection and try pieces on with our AI Selfie Try-On.
          </p>
          {socials.length > 0 && (
            <div className="mt-6 flex items-center gap-2.5">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-champagne-100 transition hover:border-gold-400/50 hover:text-gold-300"
                  data-magnetic
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Visit us */}
        <div>
          <h3 className="kicker-light mb-4">Visit Us</h3>
          <ul className="flex flex-col gap-3 text-sm text-champagne-100/70">
            {store?.address && (
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold-300" />
                <span>{store.address}</span>
              </li>
            )}
            {store?.phone && (
              <li>
                <a href={`tel:${String(store.phone).replace(/[^\d+]/g, '')}`} className="flex items-center gap-2.5 transition hover:text-champagne-50">
                  <Phone size={16} className="shrink-0 text-gold-300" /> {store.phone}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 transition hover:text-champagne-50">
                  <MessageCircle size={16} className="shrink-0 text-gold-300" /> Chat on WhatsApp
                </a>
              </li>
            )}
            {!store?.address && !store?.phone && !wa && (
              <li className="text-champagne-100/40">Contact details coming soon.</li>
            )}
          </ul>
        </div>

        {/* Explore */}
        <div>
          <h3 className="kicker-light mb-4">Explore</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-champagne-100/70">
            <li>
              <button onClick={onOpenOffers} className="transition hover:text-champagne-50" data-magnetic>Current Offers</button>
            </li>
            <li><span className="text-champagne-100/45">Gold · Diamond · Silver</span></li>
            <li><span className="text-champagne-100/45">AI Selfie Try-On</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-champagne-100/50 sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} {storeName}. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            Powered by
            <span className="inline-flex items-center gap-1 font-semibold text-gold-300">
              <Gem size={12} /> Swarnix
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
