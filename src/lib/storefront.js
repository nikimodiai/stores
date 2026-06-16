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
import { db, CATEGORIES } from './config';

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
 * Fetch a single product by id, scoped to the store's owner_id so one store
 * can never deep-link into another store's catalogue. Returns the row or null.
 */
export async function getStorefrontProduct(ownerId, productId) {
  if (!ownerId || !productId) return null;

  const { data, error } = await db
    .from('products')
    .select(PRODUCT_PUBLIC_COLS)
    .eq('owner_id', ownerId)
    .eq('id', productId)
    .eq('is_current', true)
    .eq('visibility', 'all')
    .maybeSingle();

  if (error) throw new Error(error.message || 'Failed to load product');
  return data ?? null;
}

/**
 * The N most-recently-added products (already sorted newest-first by the
 * fetch order in getStorefrontProducts). Pure helper over the loaded array.
 */
export function latestProducts(products, n = 8) {
  return [...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, n);
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

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

/**
 * The sub-category bucket a product belongs to, for the in-category
 * sub-filter row. When a product has no sub_category, it's grouped into a
 * meaningful fallback — "Other <Category label>" (e.g. "Other Rings") — so
 * customers still get a clean, named option instead of a blank pill.
 */
export function subCategoryOf(p) {
  const sub = p.sub_category && String(p.sub_category).trim();
  if (sub) return sub;
  const catLabel = CATEGORY_LABELS[p.category] || p.category || 'Pieces';
  return `Other ${catLabel}`;
}

/**
 * Distinct sub-category buckets present within a single category, ordered
 * so real sub-categories come first (alphabetically) and the "Other …"
 * fallback bucket always sinks to the end. Pass the full product array and
 * the active category value.
 */
// Real sub-categories sort alphabetically; the "Other …" fallback sinks last.
function sortSubCategories(a, b) {
  const aOther = a.startsWith('Other ');
  const bOther = b.startsWith('Other ');
  if (aOther !== bOther) return aOther ? 1 : -1;
  return a.localeCompare(b);
}

export function deriveSubCategories(products, category) {
  if (!category) return [];
  const seen = new Set();
  for (const p of products) {
    if (p.category === category) seen.add(subCategoryOf(p));
  }
  return Array.from(seen).sort(sortSubCategories);
}

/**
 * One pass over the catalogue → { [category]: [sortedSubCategories] }.
 * Used by the header's hover mega-menu so it can show each category's
 * sub-categories without recomputing per hover.
 */
export function deriveSubCategoryMap(products) {
  const map = {};
  for (const p of products) {
    if (!p.category) continue;
    (map[p.category] ||= new Set()).add(subCategoryOf(p));
  }
  for (const cat of Object.keys(map)) {
    map[cat] = Array.from(map[cat]).sort(sortSubCategories);
  }
  return map;
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

// ── Virtual Try-On ──────────────────────────────────────────────────
// Web entry point for the WhatsApp try-on workflow. The website POSTs the
// customer's selfie (base64) + the product to an n8n Webhook node, which
// runs the try-on sub-workflow and returns the generated image.
//
// Set VITE_TRYON_WEBHOOK_URL to override the default endpoint.
const env2 = (typeof import.meta !== 'undefined' && import.meta.env) || {};
export const TRYON_WEBHOOK_URL =
  env2.VITE_TRYON_WEBHOOK_URL ||
  'https://n8n.srv1639765.hstgr.cloud/webhook/swarnix-web-tryon';

// Map a product category to the jewelleryType token the try-on prompt uses
// for placement (see "Build Prompt" in the n8n workflow).
const CATEGORY_TO_JEWELLERY_TYPE = {
  Necklace: 'necklace',
  Pendant: 'pendant',
  Mangalsutra: 'mangalsutra',
  Chain: 'necklace',
  Earring: 'earrings',
  Ring: 'ring',
  Bangle: 'bangles',
  Bracelet: 'bracelet',
  Nosepin: 'nath',
  'Maang Tikka': 'maang tikka',
  Bajuband: 'baajuband',
  Kamarband: 'kamarbandh',
  Anklet: 'bracelet',
};

export function jewelleryTypeFor(product) {
  if (!product) return 'necklace';
  return CATEGORY_TO_JEWELLERY_TYPE[product.category] || 'necklace';
}

/**
 * Read a File/Blob as base64 (without the data: prefix) + its mime type.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve({ base64: result.split(',')[1] || '', mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Run the virtual try-on. Sends the selfie + product to the n8n webhook and
 * returns the workflow's response shape:
 *   { success: bool, imageUrl, caption, message, reason }
 *
 * @param {object} args
 * @param {string} args.ownerId
 * @param {object} args.product   the product being tried on
 * @param {File}   args.selfieFile
 * @param {string} [args.occasion]      '', 'wedding', 'party', 'casual', 'festive'
 * @param {string} [args.customerName]
 */
export async function runTryOn({ ownerId, product, selfieFile, occasion = '', customerName = 'Website Visitor' }) {
  if (!ownerId) return { success: false, reason: 'missing_owner', message: 'Store not identified.' };
  if (!product) return { success: false, reason: 'missing_product', message: 'No product selected.' };
  if (!selfieFile) return { success: false, reason: 'missing_selfie', message: 'Please choose a selfie first.' };

  const itemImageUrl = product.primary_image_url
    || (Array.isArray(product.images) && product.images[0])
    || '';
  if (!itemImageUrl) {
    return { success: false, reason: 'no_product_image', message: 'This product has no image to try on.' };
  }

  const { base64, mimeType } = await fileToBase64(selfieFile);

  const body = {
    owner_id: ownerId,
    selfie_base64: base64,
    mime_type: mimeType,
    item_id: product.sku || product.id,
    item_name: product.name || 'this piece',
    item_image_url: itemImageUrl,
    jewellery_type: jewelleryTypeFor(product),
    occasion: occasion || '',
    customer_name: customerName || 'Website Visitor',
  };

  // Gemini + Seedream + Cloudinary can take 30–40s; allow generous headroom.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(TRYON_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { success: false, reason: 'server_error', message: `Try-on service error (${res.status}).` };
    }

    const data = await res.json();
    // The webhook may return the sub-workflow output directly, or wrapped in
    // an array (n8n's default). Normalise to a single object.
    const out = Array.isArray(data) ? (data[0] || {}) : data;
    return {
      success: !!out.success,
      imageUrl: out.imageUrl || null,
      caption: out.caption || '',
      message: out.message || '',
      reason: out.reason || '',
      remaining: out.remaining,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return { success: false, reason: 'timeout', message: 'The try-on took too long. Please try again.' };
    }
    return { success: false, reason: 'network_error', message: 'Network error. Please try again.' };
  }
}
