import { useRef } from 'react';
import { m, useInView } from 'framer-motion';
import { fadeUp, scaleIn, fade, stagger, inView as inViewCfg } from '../lib/motion';

// ── Reveal ───────────────────────────────────────────────────────────
// The storefront's one motion primitive: "fade/scale up once when scrolled
// into view". Uses the public `useInView` hook (a standalone
// IntersectionObserver) rather than `whileInView` — the latter's viewport
// feature is NOT bundled in LazyMotion's `domAnimation`, so it never fires.
// Centralising this keeps every section animating identically and honours
// reduced-motion via MotionConfig (index.jsx).
//
//   <Reveal>…</Reveal>                  → fade-up on scroll
//   <Reveal variant="scale">…</Reveal>  → scale-in on scroll
//   <Reveal stagger>                    → parent that staggers its children
//     <Reveal item>…</Reveal>           → child rising in sequence
//   </Reveal>
const VARIANTS = { up: fadeUp, scale: scaleIn, fade };

export default function Reveal({
  children,
  as = 'div',
  variant = 'up',
  item = false,
  stagger: isStagger = false,
  gap = 0.09,
  delay = 0,
  className,
  ...rest
}) {
  // Hooks must run unconditionally; for `item` the ref simply goes unused.
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: inViewCfg.once,
    amount: inViewCfg.amount,
    margin: inViewCfg.margin,
  });

  const Comp = m[as] || m.div;

  // Items inside a staggering parent inherit the parent's orchestration —
  // they declare only their own hidden/show variant, no trigger of their own.
  if (item) {
    return (
      <Comp variants={VARIANTS[variant]} className={className} {...rest}>
        {children}
      </Comp>
    );
  }

  const variants = isStagger ? stagger(gap, delay) : VARIANTS[variant];

  return (
    <Comp
      ref={ref}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      variants={variants}
      transition={!isStagger && delay ? { delay } : undefined}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}
