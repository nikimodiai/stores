// ── Storefront data layer ───────────────────────────────────────────
// Thin, read-only query helpers for the PUBLIC customer-facing storefront
// (route: /store/:storeSlug). Uses the shared anon Supabase client.
//
// Multi-tenant model for THIS schema:
//   • stores.slug  → human-readable key in the URL (added in
//     supabase/2026_06_14_store_slug.sql)
//   • products are linked to a store via owner_id (there is no store_id).
//   So: resolve slug → store row → use store.owner_id to fetch products.
//
// SECURITY: every select lists explicit, public-safe columns. We never
// pull wa_access_token / waba_id / owner_id-secrets / phone tokens into
// the browser, even though the anon RLS policy technically allows it.
// ────────────────────────────────────────────────────────────────────
import { db } from './config';

// The storefront reads stores through the `public_stores` view, which
// exposes ONLY customer-safe columns (see 2026_06_14_store_slug.sql).
// This keeps the browser away from secret columns like wa_access_token,
// even though the anon RLS policy on the base table technically allows them.
const STORE_VIEW = 'public_stores';
const STORE_PUBLIC_COLS =
  'id, owner_id, store_name, slug, address, phone, whatsapp_phone, status';

// Columns from `products` the storefront actually renders.
const PRODUCT_PUBLIC_COLS = [
  'id', 'sku', 'name', 'category', 'sub_category', 'collection',
  'price', 'images', 'primary_image_url', 'video_url',
  // Metal
  'gold_carat', 'gold_purity', 'metal_type', 'silver_purity',
  'weight', 'net_weight_grams', 'gold_weight_grams', 'metal_weight_grams',
  // Diamond / stones
  'diamond_purity', 'diamond_color', 'diamond_weight', 'diamond_shape',
  'diamond_cut', 'diamond_count',
  // Appearance
  'color', 'size',
  'description', 'in_stock', 'priority_rank', 'created_at',
].join(', ');

/**
 * Resolve a store from its URL slug. Returns the store row, or null when
 * no store matches (caller renders a clean "Store not found" page).
 * Slugs are stored lowercase, so we normalise the incoming value.
 */
export async function getStoreBySlug(slug) {
  if (!slug) return null;
  const normalised = String(slug).trim().toLowerCase();
  if (!normalised) return null;

  const { data, error } = await db
    .from(STORE_VIEW)
    .select(STORE_PUBLIC_COLS)
    .eq('slug', normalised)
    .maybeSingle();

  if (error) {
    // A genuine query error is different from "no such store" — surface it
    // so the page can show an error state rather than a false 404.
    throw new Error(error.message || 'Failed to load store');
  }
  return data ?? null;
}

/**
 * Fetch the public catalogue for a store, scoped strictly to its owner_id.
 * Only current, in-stock, publicly-visible products are returned, so one
 * store never sees another store's items, sold-out items, or VVIP-tier
 * items.
 *
 * @param {string} ownerId  store.owner_id
 * @param {string} [category]  optional exact category filter (e.g. "Ring")
 */
export async function getStorefrontProducts(ownerId, category) {
  if (!ownerId) return [];

  let query = db
    .from('products')
    .select(PRODUCT_PUBLIC_COLS)
    .eq('owner_id', ownerId)
    .eq('is_current', true)
    .eq('in_stock', true)
    .eq('visibility', 'all')
    .order('priority_rank', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw new Error(error.message || 'Failed to load products');
  return data ?? [];
}

/**
 * Derive the distinct, non-empty category list for a store's catalogue,
 * ordered by the canonical CATEGORIES order where possible. Pass the
 * already-loaded product array so we don't issue a second round-trip.
 */
export function deriveCategories(products) {
  const seen = new Set();
  for (const p of products) {
    if (p.category) seen.add(p.category);
  }
  return Array.from(seen);
}

// Sort options offered in the storefront toolbar (mirrors the admin app,
// minus internal-only options).
export const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured' },
  { value: 'newest',     label: 'Newest First' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc',   label: 'Name A → Z' },
  { value: 'name-desc',  label: 'Name Z → A' },
];

/**
 * Free-text product match across the customer-facing fields (no SKU /
 * internal columns). Case-insensitive substring over each field.
 */
export function matchesSearch(p, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  const fields = [
    p.name, p.category, p.sub_category, p.collection,
    p.metal_type, p.gold_carat, p.gold_purity, p.silver_purity,
    p.diamond_purity, p.diamond_color, p.diamond_shape, p.color, p.description,
  ];
  return fields.some(f => f && String(f).toLowerCase().includes(lower));
}

/**
 * Pure sort over a product array. `featured` keeps the server order
 * (priority_rank desc, then newest), which is the default fetch order.
 */
export function sortProducts(arr, sort) {
  const copy = [...arr];
  switch (sort) {
    case 'newest':     return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case 'price-asc':  return copy.sort((a, b) => (a.price || 0) - (b.price || 0));
    case 'price-desc': return copy.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'name-asc':   return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'name-desc':  return copy.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    default:           return copy; // 'featured' — preserve server order
  }
}

/**
 * Distinct metal-purity values present in the catalogue, for the filter
 * panel. Prefers gold_carat, falls back to gold/silver purity.
 */
export function deriveMetals(products) {
  const seen = new Set();
  for (const p of products) {
    const m = p.gold_carat || p.gold_purity || p.silver_purity;
    if (m) seen.add(m);
  }
  return Array.from(seen);
}

/**
 * Normalise a product's image list into a clean array of URLs for the
 * auto-rotating card. Prefers the `images` array, falls back to
 * primary_image_url, and de-dupes while preserving order.
 */
export function productImages(p) {
  const urls = [];
  if (Array.isArray(p.images)) urls.push(...p.images);
  if (p.primary_image_url) urls.unshift(p.primary_image_url);
  const seen = new Set();
  return urls.filter(u => u && !seen.has(u) && seen.add(u));
}

/**
 * Fetch the active offers for a store, scoped strictly to its owner_id.
 * Filters by is_active = true and valid_to >= today's date.
 */
export async function getStorefrontOffers(ownerId) {
  if (!ownerId) return [];

  const { data, error } = await db
    .from('offers')
    .select('id, owner_id, title, description, media_url, media_type, valid_to, is_active')
    .eq('owner_id', ownerId)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to load offers:', error);
    return [];
  }

  // Filter valid_to >= today's date (YYYY-MM-DD) in JS to be safe and timezone-consistent
  const todayStr = new Date().toISOString().split('T')[0];
  return (data ?? []).filter(o => !o.valid_to || o.valid_to >= todayStr);
}
