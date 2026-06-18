import { useEffect, useRef } from 'react';

// ── LuxeCursor ───────────────────────────────────────────────────────
// A bespoke gold/champagne cursor: an outer ring + inner dot that trails
// the pointer, expands + glows over interactive elements, and is gently
// pulled toward `[data-magnetic]` targets (CTAs, nav).
//
// Restraint by design:
//   • Only mounts on fine pointers (real mouse) AND when reduced-motion is
//     OFF — touch users and reduced-motion users keep the system cursor.
//   • Pure transform writes inside a single rAF loop (no React re-renders,
//     no layout thrash). Unmounts cleanly and restores the native cursor.
const isInteractive = (el) =>
  !!el?.closest?.('a, button, [role="button"], input, textarea, select, label, [data-magnetic]');

export default function LuxeCursor() {
  const ringRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia?.('(pointer: fine)').matches;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduced) return; // keep native cursor

    document.documentElement.classList.add('luxe-cursor-on');

    const wrap = wrapRef.current;
    const ring = ringRef.current;
    if (!wrap || !ring) return;

    // Pointer target vs. eased follower position.
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let magnetEl = null;
    let raf = 0;
    let visible = false;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        wrap.style.opacity = '1';
      }
      const target = e.target;
      const hot = isInteractive(target);
      wrap.classList.toggle('is-hover', hot);

      // Magnetic pull: when over a [data-magnetic] element, bias the target
      // toward its centre so the ring "snaps" softly to the control.
      const mag = target?.closest?.('[data-magnetic]');
      magnetEl = mag || null;
    };

    const onDown = () => wrap.classList.add('is-down');
    const onUp = () => wrap.classList.remove('is-down');
    const onLeave = () => { visible = false; wrap.style.opacity = '0'; };

    const tick = () => {
      // Soft magnetic attraction toward the hovered control's centre.
      let gx = tx;
      let gy = ty;
      if (magnetEl) {
        const r = magnetEl.getBoundingClientRect();
        const mxc = r.left + r.width / 2;
        const myc = r.top + r.height / 2;
        gx = tx + (mxc - tx) * 0.35;
        gy = ty + (myc - ty) * 0.35;
      }
      // Easing toward the (possibly magnetised) goal.
      cx += (gx - cx) * 0.18;
      cy += (gy - cy) * 0.18;
      wrap.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.documentElement.classList.remove('luxe-cursor-on');
    };
  }, []);

  return (
    <div ref={wrapRef} className="luxe-cursor" style={{ opacity: 0 }} aria-hidden="true">
      <span ref={ringRef} className="luxe-cursor__ring" />
      <span className="luxe-cursor__dot" />
    </div>
  );
}
