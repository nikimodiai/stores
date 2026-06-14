import React from 'react';
import { Gem } from 'lucide-react';
import styles from './Storefront.module.css';

// Clean "Store not found" page — shown when the slug matches no store.
// Never a crash or an empty grid.
export default function StoreNotFound({ slug }) {
  return (
    <div className={styles.notFound}>
      <Gem size={42} strokeWidth={1} className={styles.notFoundIcon} />
      <h1 className={styles.notFoundTitle}>Store not found</h1>
      <p className={styles.notFoundText}>
        {slug
          ? <>We couldn&apos;t find a store at <strong>/{slug}</strong>.</>
          : 'This store link is incomplete.'}
        {' '}Please check the link and try again.
      </p>
    </div>
  );
}
