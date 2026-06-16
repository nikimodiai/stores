import React from 'react';
import { Gem } from 'lucide-react';

// Clean "Store not found" page — shown when the slug matches no store
// (and at the bare root path). Never a crash or an empty grid.
export default function StoreNotFound({ slug }) {
  return (
    <div className="grid min-h-screen place-items-center bg-hero-warm px-6">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-white/70 text-gold-400 shadow-card ring-1 ring-gold-200/60">
          <Gem size={40} strokeWidth={1} />
        </span>
        <h1 className="display text-[28px]">Store not found</h1>
        <p className="max-w-[42ch] leading-relaxed text-ink-mid">
          {slug
            ? <>We couldn&apos;t find a store at <strong className="text-ink">/{slug}</strong>.</>
            : 'This store link is incomplete.'}
          {' '}Please check the link and try again.
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-700">
          <Gem size={12} /> Powered by Swarnix
        </span>
      </div>
    </div>
  );
}
