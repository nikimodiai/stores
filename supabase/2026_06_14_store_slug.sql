-- ════════════════════════════════════════════════════════════════════
-- SWARNIX — public storefront slug
-- Apply in Supabase SQL editor. Idempotent.
-- ════════════════════════════════════════════════════════════════════
--
-- The customer-facing storefront resolves a URL like /store/rmdiamonds
-- to a single store. The stores table had no human-readable key, so we
-- add a unique `slug` column. Products are linked to a store via
-- owner_id (there is no store_id), so the storefront looks up the store
-- by slug, then fetches products WHERE owner_id = <that store's owner_id>.
-- ────────────────────────────────────────────────────────────────────

-- 1) Add the column
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS slug text;

-- 2) Backfill a slug for existing stores from store_name
--    (lowercase, strip non-alphanumerics, collapse to single hyphens).
--    Falls back to the row id when store_name is null/blank.
UPDATE public.stores
SET slug = COALESCE(
  NULLIF(
    regexp_replace(
      regexp_replace(lower(coalesce(store_name, '')), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    ),
    ''
  ),
  id::text
)
WHERE slug IS NULL;

-- 3) De-duplicate any slug collisions from the backfill by appending a
--    short suffix from the id, so the unique index below can be created.
WITH dups AS (
  SELECT id,
         slug,
         row_number() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM public.stores
  WHERE slug IS NOT NULL
)
UPDATE public.stores s
SET slug = s.slug || '-' || left(s.id::text, 4)
FROM dups
WHERE s.id = dups.id AND dups.rn > 1;

-- 4) Enforce uniqueness (case-sensitive; slugs are always stored lowercase).
CREATE UNIQUE INDEX IF NOT EXISTS stores_slug_key
  ON public.stores (slug)
  WHERE slug IS NOT NULL;

-- 5) Public storefront view — minimal, safe columns only.
--    Why a view: the staff_read_stores policy (2026_05_30_store_users.sql)
--    grants anon SELECT on ALL store columns — including wa_access_token —
--    because staff sessions run as the anon role and the admin app needs
--    those columns. The public storefront must NOT read through that path.
--    This view exposes only customer-safe columns, so the storefront never
--    touches secret columns even by accident.
--
--    NOTE: this reduces over-fetch and documents intent, but does not by
--    itself revoke anon's direct access to stores.wa_access_token (that is
--    constrained by the staff-auth design and tracked in SECURITY_NOTES.md).
--    Views run with the view owner's rights; this one is restricted to the
--    columns below regardless of the caller.
DROP VIEW IF EXISTS public.public_stores;
CREATE VIEW public.public_stores
  WITH (security_invoker = false) AS
SELECT
  id,
  owner_id,
  store_name,
  slug,
  address,
  phone,
  whatsapp_phone,
  status
FROM public.stores
WHERE slug IS NOT NULL;

-- Anonymous storefront visitors may read the view.
GRANT SELECT ON public.public_stores TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- DONE — verify with:
--   SELECT id, store_name, slug FROM public.public_stores ORDER BY store_name;
-- ════════════════════════════════════════════════════════════════════
