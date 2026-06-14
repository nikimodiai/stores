# Swarnix — Stores Site

Public, multi-tenant customer storefront for Swarnix jewellery stores.
Each store is served at `/:storeSlug` (e.g. `/swarnix-jewellers`) from one
codebase — the layout is identical for every store; only the data changes
based on the slug.

This is a **separate** project from the owner/admin app (`../karat-v3`).
It is read-only and shares only the Supabase database.

## Stack
- Vite + React + React Router
- Supabase JS (anon key, read-only) — reads the `public_stores` view and
  the `products` table.

## How a store resolves
1. `/:storeSlug` → `getStoreBySlug(slug)` looks up `public_stores.slug`.
2. The matched store's `owner_id` → `getStorefrontProducts(owner_id)`
   (only `is_current`, `in_stock`, `visibility='all'` products).
3. No match → clean "Store not found" page.

## Setup
```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173/swarnix-jewellers
```

## Database
Apply `supabase/2026_06_14_store_slug.sql` once (in the Supabase SQL
editor) to add `stores.slug` and the `public_stores` view. The storefront
will not resolve any slug until this is applied.

## Deploy
`vercel.json` rewrites all paths to `index.html` so deep links like
`/swarnix-jewellers` work on a static host.
