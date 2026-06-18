// ── Shared motion system ─────────────────────────────────────────────
// One source of truth for the storefront's animation language so motion
// feels designed, not bolted-on per component. Luxury brands move slowly
// and never bounce — every transition uses a long, eased curve.
//
// Used with framer-motion's `m` component under a single <LazyMotion>
// (see index.jsx) to keep the bundle small. Reveal.jsx wraps these for
// the common "fade up on scroll" case.

// Calm, expensive easing — no overshoot.
export const EASE = [0.22, 0.61, 0.36, 1];

// Single element rising into place.
export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

// Gentle scale-in for imagery / cards.
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: EASE },
  },
};

// Soft fade only (for backgrounds / scrims).
export const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: EASE } },
};

// Parent that staggers its children's reveal. Pair with `fadeUp` items.
export const stagger = (gap = 0.09, delay = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: gap, delayChildren: delay },
  },
});

// Editorial line/word reveal (clip-mask rising text).
export const revealMask = {
  hidden: { opacity: 0, y: '60%' },
  show: {
    opacity: 1,
    y: '0%',
    transition: { duration: 0.85, ease: EASE },
  },
};

// Shared viewport config so every reveal triggers once, slightly early.
export const inView = { once: true, amount: 0.25, margin: '0px 0px -10% 0px' };
