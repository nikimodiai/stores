import { createClient } from '@supabase/supabase-js';

// ── Env-driven config (Vite reads VITE_* at build time) ─────────────
// The public storefront only needs Supabase (read-only, anon key).
// Set VITE_* in .env.local for dev and in the host (Vercel) for prod.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ||
  'https://bigmdvjrvqyqzyrijdum.supabase.co';

export const SUPABASE_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  // PUBLIC anon key (safe in browser — every table is protected by RLS).
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZ21kdmpydnF5cXp5cmlqZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDU0OTcsImV4cCI6MjA5Mzk4MTQ5N30.8WWSA8xC0ySHhAgz9pscBvI5O2r6-LSejuy-mnyzRdM';

// Read-only public client. No session persistence — visitors are anonymous.
export const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Categories ──────────────────────────────────────────────────────
// Canonical category list (value → display label), used to order and
// label the storefront's data-driven category nav.
export const CATEGORIES = [
  { value: 'Silver', label: 'Silver Jewellery' },
  { value: 'Lab-Grown Diamond', label: 'Lab-Grown Diamonds' },
  { value: 'Loose Stone', label: 'Loose Stones' },
  { value: 'Coin', label: 'Gold Coins & Bars' },
  { value: 'Ring', label: 'Rings' },
  { value: 'Earring', label: 'Earrings' },
  { value: 'Necklace', label: 'Necklaces' },
  { value: 'Bangle', label: 'Bangles' },
  { value: 'Bracelet', label: 'Bracelets' },
  { value: 'Pendant', label: 'Pendants' },
  { value: 'Mangalsutra', label: 'Mangalsutra' },
  { value: 'Chain', label: 'Chains' },
  { value: 'Anklet', label: 'Anklets' },
  { value: 'Nosepin', label: 'Nosepins' },
  { value: 'Maang Tikka', label: 'Maang Tikka' },
  { value: 'Bajuband', label: 'Bajuband (Armlets)' },
  { value: 'Kamarband', label: 'Kamarband (Waist Belt)' },
  { value: 'Haath Phool', label: 'Haath Phool' },
  { value: 'Bichhiya', label: 'Bichhiya (Toe Rings)' },
  { value: 'Brooch', label: 'Brooches' },
  { value: 'Set', label: 'Sets' },
  { value: 'Other', label: 'Other' },
];

// ── Variant colors ──────────────────────────────────────────────────
// Mirrors the admin app's VARIANT_COLORS (VariantEditor.jsx) so swatches
// on the storefront match what the owner picks when adding a variant.
export const VARIANT_COLORS = [
  { value: 'Yellow Gold', label: 'Yellow Gold', hex: '#C9A84C' },
  { value: 'Rose Gold',   label: 'Rose Gold',   hex: '#B76E79' },
  { value: 'White Gold',  label: 'White Gold',  hex: '#D0D0D0' },
  { value: 'Two-Tone',    label: 'Two-Tone',    hex: null },
  { value: 'Silver',      label: 'Silver',      hex: '#A8A9AD' },
];
