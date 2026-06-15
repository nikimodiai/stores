import { useEffect, useRef, useState } from 'react';
import { X, Camera, Sparkles, RefreshCw, Download } from 'lucide-react';
import { runTryOn } from '../lib/storefront';
import styles from './TryOnModal.module.css';

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
  };

  return (
    <div className={styles.backdrop} onClick={phase === 'loading' ? undefined : onClose} role="dialog" aria-modal="true" aria-label="Virtual try-on">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <div className={styles.headTitle}>
            <Sparkles size={18} className={styles.headIcon} />
            <h2>Virtual Try-On</h2>
          </div>
          {phase !== 'loading' && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </header>

        <div className={styles.body}>
          {/* The product being tried on */}
          <div className={styles.productStrip}>
            <img
              src={product?.primary_image_url || (Array.isArray(product?.images) && product.images[0]) || ''}
              alt={product?.name}
              className={styles.productThumb}
              draggable={false}
            />
            <div>
              <p className={styles.productLabel}>Trying on</p>
              <p className={styles.productName}>{product?.name}</p>
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
                style={{ display: 'none' }}
                onChange={pickSelfie}
              />

              <button
                type="button"
                className={styles.selfieDrop}
                onClick={() => fileRef.current?.click()}
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Your selfie" className={styles.selfiePreview} />
                ) : (
                  <span className={styles.selfieDropInner}>
                    <Camera size={28} />
                    <span className={styles.selfieDropText}>Take or upload a selfie</span>
                    <span className={styles.selfieDropHint}>A clear, front-facing photo works best</span>
                  </span>
                )}
              </button>

              {selfiePreview && (
                <button className={styles.changeSelfie} onClick={() => fileRef.current?.click()}>
                  Choose a different photo
                </button>
              )}

              <div className={styles.occasionWrap}>
                <p className={styles.occasionLabel}>Styling for</p>
                <div className={styles.occasionPills}>
                  {OCCASIONS.map(o => (
                    <button
                      key={o.value || 'none'}
                      className={`${styles.occasionPill} ${occasion === o.value ? styles.occasionPillActive : ''}`}
                      onClick={() => setOccasion(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={styles.generateBtn}
                onClick={generate}
                disabled={!selfieFile}
              >
                <Sparkles size={16} /> Create my look
              </button>
              <p className={styles.privacyNote}>
                Your selfie is used only to generate this try-on.
              </p>
            </>
          )}

          {/* ── Step 2: loading ── */}
          {phase === 'loading' && (
            <div className={styles.loadingWrap}>
              <div className={styles.spinner} />
              <p className={styles.loadingTitle}>Creating your look…</p>
              <p className={styles.loadingText}>This usually takes about 30–40 seconds. Please don&apos;t close this window.</p>
            </div>
          )}

          {/* ── Step 3a: result ── */}
          {phase === 'result' && result && (
            <div className={styles.resultWrap}>
              <img src={result.imageUrl} alt="Your try-on" className={styles.resultImg} draggable={false} />
              {result.caption && <p className={styles.resultCaption}>{result.caption}</p>}
              <div className={styles.resultActions}>
                <button className={styles.secondaryBtn} onClick={startOver}>
                  <RefreshCw size={15} /> Try another selfie
                </button>
                <a
                  className={styles.primaryBtn}
                  href={result.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Download size={15} /> Save image
                </a>
              </div>
            </div>
          )}

          {/* ── Step 3b: error ── */}
          {phase === 'error' && (
            <div className={styles.errorWrap}>
              <p className={styles.errorText}>{errorMsg}</p>
              <button className={styles.generateBtn} onClick={startOver}>
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
