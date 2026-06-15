import React, { useState, useRef, useEffect } from 'react';
import {
  Search, X, SlidersHorizontal, ArrowUpDown, Grid, List, Gem,
  ShoppingBag, Menu, Tag,
} from 'lucide-react';
import { CATEGORIES } from '../lib/config';
import { SORT_OPTIONS } from '../lib/storefront';
import styles from './Storefront.module.css';

// Map a raw category value (e.g. "Ring") to its display label ("Rings").
const LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
const labelFor = (cat) => LABELS[cat] || cat;

// Sticky storefront header with a working toolbar that mirrors the admin
// Inventory page: data-driven category nav, search, filter, sort, and
// grid/list view toggle. On mobile the categories collapse into a drawer.
export default function StoreHeader({
  storeName, categories, active, onSelect,
  search, onSearch,
  sort, onSort,
  metals, metalFilter, onMetalFilter,
  viewMode, onViewMode,
  resultCount,
  onOpenOffers,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close the sort dropdown on outside click (same pattern as the admin app).
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (cat) => {
    onSelect(cat);
    setMenuOpen(false);
  };

  const hasFilters = !!metalFilter;

  return (
    <header className={styles.header}>
      {/* Row 1 — brand, category nav, cart */}
      <div className={styles.headerInner}>
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <button className={styles.brand} onClick={() => pick(null)}>
          {storeName}
        </button>

        <nav className={styles.nav}>
          <button
            className={styles.navOffers}
            onClick={onOpenOffers}
          >
            <Tag size={13} /> Offers
          </button>
          <button
            className={active == null ? styles.navItemActive : styles.navItem}
            onClick={() => pick(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={active === cat ? styles.navItemActive : styles.navItem}
              onClick={() => pick(cat)}
            >
              {labelFor(cat)}
            </button>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <button className={styles.iconBtn} aria-label="Cart">
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>

      {/* Row 2 — toolbar: search + filter + sort + view */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search name, category, metal, diamond…"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => onSearch('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          className={`${styles.toolBtn} ${(showFilters || hasFilters) ? styles.toolBtnActive : ''}`}
          onClick={() => setShowFilters(p => !p)}
          title="Filters"
          aria-label="Filters"
        >
          <SlidersHorizontal size={15} />
          {hasFilters && <span className={styles.filterDot} />}
        </button>

        <div className={styles.sortWrap} ref={sortRef}>
          <button
            className={styles.toolBtn}
            onClick={() => setSortOpen(p => !p)}
            title="Sort"
            aria-label="Sort"
          >
            <ArrowUpDown size={15} />
          </button>
          {sortOpen && (
            <div className={styles.sortDropdown}>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.sortOpt} ${sort === opt.value ? styles.sortOptActive : ''}`}
                  onClick={() => { onSort(opt.value); setSortOpen(false); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
            onClick={() => onViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid size={14} />
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
            onClick={() => onViewMode('list')}
            aria-label="List view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}><Gem size={12} /> Metal / Purity</span>
            <div className={styles.filterPills}>
              <button
                className={`${styles.filterPill} ${!metalFilter ? styles.filterPillActive : ''}`}
                onClick={() => onMetalFilter('')}
              >
                Any
              </button>
              {metals.map(m => (
                <button
                  key={m}
                  className={`${styles.filterPill} ${metalFilter === m ? styles.filterPillActive : ''}`}
                  onClick={() => onMetalFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterFooter}>
            <span className={styles.resultCount}>
              {resultCount} item{resultCount !== 1 ? 's' : ''}
            </span>
            {hasFilters && (
              <button className={styles.clearFiltersBtn} onClick={() => onMetalFilter('')}>
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile category drawer */}
      {menuOpen && (
        <nav className={styles.mobileMenu}>
          <button
            className={styles.mobileOffers}
            onClick={() => { onOpenOffers(); setMenuOpen(false); }}
          >
            <Tag size={15} /> Offers
          </button>
          <button
            className={active == null ? styles.mobileItemActive : styles.mobileItem}
            onClick={() => pick(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={active === cat ? styles.mobileItemActive : styles.mobileItem}
              onClick={() => pick(cat)}
            >
              {labelFor(cat)}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
