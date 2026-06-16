import { useEffect, useRef, useState } from 'react';
import { X, Camera, Sparkles, RefreshCw, Download, Share2, MessageCircle, Mail, Copy, Check } from 'lucide-react';
import { runTryOn } from '../lib/storefront';

// Occasion options — mirror the outfit map in the n8n "Build Prompt" node.
const OCCASIONS = [
  { value: '', label: 'Just the jewellery' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'party', label: 'Party' },
  { value: 'festive', label: 'Festive' },
  { value: 'casual', label: 'Casual' },
];

// ── Selfie Try-On modal ─────────────────────────────────────────────
// Step 1: pick a selfie + occasion.  Step 2: generating (long spinner).
// Step 3: result image, or an error with retry.
export default function TryOnModal({ open, ownerId, product, customerName, onClose }) {
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [occasion, setOccasion] = useState('');
  const [phase, setPhase] = useState('input'); // input | loading | result | error
  const [result, setResult] = useState(null);  // { imageUrl, caption }
  const [errorMsg, setErrorMsg] = useState('');
  const [shareFallback, setShareFallback] = useState(false); // desktop link menu
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  // Reset everything when the modal opens/closes.
  useEffect(() => {
    if (!open) {
      setSelfieFile(null);
      setSelfiePreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
      setOccasion('');
      setPhase('input');
      setResult(null);
      setErrorMsg('');
      setShareFallback(false);
      setCopied(false);
    }
  }, [open]);

  // Escape to close (but not mid-generation, to avoid losing a paid credit).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && phase !== 'loading') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, phase, onClose]);

  if (!open) return null;

  const pickSelfie = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieFile(file);
    setSelfiePreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const generate = async () => {
    if (!selfieFile) return;
    setPhase('loading');
    setErrorMsg('');
    const res = await runTryOn({ ownerId, product, selfieFile, occasion, customerName });
    if (res.success && res.imageUrl) {
      setResult({ imageUrl: res.imageUrl, caption: res.caption });
      setPhase('result');
    } else {
      setErrorMsg(res.message || 'Could not create your try-on. Please try a clearer, front-facing selfie.');
      setPhase('error');
    }
  };

  const startOver = () => {
    setPhase('input');
    setResult(null);
    setErrorMsg('');
    setShareFallback(false);
  };

  // Share text reused across the native sheet and the fallback links.
  const shareTitle = 'My Virtual Try-On';
  const shareText = `Check out how this ${product?.name || 'piece'} looks on me — created with ${customerName ? '' : ''}Virtual Try-On!`.trim();

  // Share the result. On mobile (and supporting browsers) this opens the
  // native share sheet — WhatsApp, Gmail, Instagram, etc. We first try to
  // share the actual image file; if that's unsupported we share the URL;
  // and if the Web Share API is missing entirely we reveal a small menu
  // with direct WhatsApp / email / copy-link options.
  const handleShare = async () => {
    const url = result?.imageUrl;
    if (!url) return;

    // 1) Try sharing the image file itself (best result in WhatsApp/Insta).
    if (navigator.canShare) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'tryon.jpg', { type: blob.type || 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: shareTitle, text: shareText });
          return;
        }
      } catch (err) {
        if (err?.name === 'AbortError') return; // user dismissed the sheet
        // fall through to URL share / fallback menu
      }
    }

    // 2) Fall back to sharing the URL via the native sheet.
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    // 3) No Web Share API (most desktops) — show the link menu.
    setShareFallback(v => !v);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked — ignore */ }
  };

  const waShareUrl = result
    ? `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${result.imageUrl}`)}`
    : '#';
  const mailShareUrl = result
    ? `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${result.imageUrl}`)}`
    : '#';

  const productImg = product?.primary_image_url || (Array.isArray(product?.images) && product.images[0]) || '';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-ink/50 p-3 backdrop-blur-sm sm:p-6 animate-fadeIn"
      onClick={phase === 'loading' ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Virtual try-on"
    >
      <div
        className="my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-cream shadow-[0_30px_80px_-20px_rgba(42,33,24,.5)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line bg-gradient-to-r from-gold-50 to-cream px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
              <Sparkles size={17} />
            </span>
            <h2 className="display text-xl">Virtual Try-On</h2>
          </div>
          {phase !== 'loading' && (
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </header>

        <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-6">
          {/* The product being tried on */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
            <img
              src={productImg}
              alt={product?.name}
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
              draggable={false}
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-luxe text-gold-700">Trying on</p>
              <p className="truncate text-sm font-medium text-ink">{product?.name}</p>
            </div>
          </div>

          {/* ── Step 1: input ── */}
          {phase === 'input' && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={pickSelfie}
              />

              <button
                type="button"
                className="grid w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-gold-200 bg-ivory/70 transition hover:border-gold-400 hover:bg-ivory"
                onClick={() => fileRef.current?.click()}
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Your selfie" className="max-h-64 w-full object-contain" />
                ) : (
                  <span className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-gold-100 text-gold-700">
                      <Camera size={26} />
                    </span>
                    <span className="text-sm font-semibold text-ink">Take or upload a selfie</span>
                    <span className="text-xs text-ink-mid">A clear, front-facing photo works best</span>
                  </span>
                )}
              </button>

              {selfiePreview && (
                <button
                  className="mt-2 w-full text-center text-[13px] font-medium text-gold-700 transition hover:text-gold-800"
                  onClick={() => fileRef.current?.click()}
                >
                  Choose a different photo
                </button>
              )}

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-luxe text-ink-mid">Styling for</p>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map(o => (
                    <button
                      key={o.value || 'none'}
                      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
                        occasion === o.value
                          ? 'border-gold-700 bg-gold-700 font-semibold text-white'
                          : 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink'
                      }`}
                      onClick={() => setOccasion(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn-gold mt-6 w-full" onClick={generate} disabled={!selfieFile}>
                <Sparkles size={16} /> Create my look
              </button>
              <p className="mt-2.5 text-center text-xs text-ink-soft">
                Your selfie is used only to generate this try-on.
              </p>
            </>
          )}

          {/* ── Step 2: loading ── */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <div className="spinner" />
              <p className="mt-1 font-serif text-lg font-bold text-ink">Creating your look…</p>
              <p className="max-w-[40ch] text-sm leading-relaxed text-ink-mid">
                This usually takes about 30–40 seconds. Please don&apos;t close this window.
              </p>
            </div>
          )}

          {/* ── Step 3a: result ── */}
          {phase === 'result' && result && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={result.imageUrl}
                alt="Your try-on"
                className="max-h-[55vh] w-full rounded-2xl object-contain shadow-card"
                draggable={false}
              />
              {result.caption && (
                <p className="text-center text-sm italic leading-relaxed text-ink-mid">{result.caption}</p>
              )}
              <div className="flex w-full flex-col gap-2.5 sm:flex-row">
                <button className="btn-gold flex-1" onClick={handleShare}>
                  <Share2 size={16} /> Share
                </button>
                <a
                  className="btn-outline flex-1"
                  href={result.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Download size={15} /> Save image
                </a>
              </div>

              {/* Desktop fallback — direct share links when Web Share API is absent */}
              {shareFallback && (
                <div className="w-full rounded-2xl border border-line bg-white p-2 animate-scaleIn">
                  <div className="grid grid-cols-3 gap-1.5">
                    <a
                      href={waShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium text-ink-mid transition hover:bg-sand hover:text-ink"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-green-600">
                        <MessageCircle size={18} />
                      </span>
                      WhatsApp
                    </a>
                    <a
                      href={mailShareUrl}
                      className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium text-ink-mid transition hover:bg-sand hover:text-ink"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-50 text-gold-700">
                        <Mail size={18} />
                      </span>
                      Email
                    </a>
                    <button
                      onClick={copyLink}
                      className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium text-ink-mid transition hover:bg-sand hover:text-ink"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink">
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </span>
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                </div>
              )}

              <button className="text-[13px] font-medium text-gold-700 transition hover:text-gold-800" onClick={startOver}>
                <RefreshCw size={14} className="mr-1 inline" /> Try another selfie
              </button>
            </div>
          )}

          {/* ── Step 3b: error ── */}
          {phase === 'error' && (
            <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
              <p className="max-w-[44ch] text-sm leading-relaxed text-maroon-600">{errorMsg}</p>
              <button className="btn-gold" onClick={startOver}>
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
