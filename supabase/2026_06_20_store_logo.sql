-- ════════════════════════════════════════════════════════════════════
-- SWARNIX — store logo + name-style images
-- Apply in Supabase SQL editor. Idempotent.
-- ════════════════════════════════════════════════════════════════════
--
-- Lets a store show a custom logo image and a custom store-name image
-- (e.g. a stylised wordmark) instead of the default generic logo + text.
-- Both are optional; the storefront falls back to the default rendering
-- when either is null.
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS logo_url text NULL,
  ADD COLUMN IF NOT EXISTS name_style_url text NULL;

-- Re-create the public storefront view to expose the two new columns
-- (view definition lives in 2026_06_14_store_slug.sql).
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
  status,
  selfie_tryon_tier,
  logo_url,
  name_style_url
FROM public.stores
WHERE slug IS NOT NULL;

GRANT SELECT ON public.public_stores TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- DONE — verify with:
--   SELECT id, store_name, logo_url, name_style_url FROM public.public_stores;
-- ════════════════════════════════════════════════════════════════════
