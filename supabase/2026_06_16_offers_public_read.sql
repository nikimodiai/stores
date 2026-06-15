-- ════════════════════════════════════════════════════════════════════
-- SWARNIX — public storefront read access for OFFERS
-- Apply in Supabase SQL editor. Idempotent.
-- ════════════════════════════════════════════════════════════════════
--
-- The storefront's "Offers" tab (and hero) reads public.offers with the
-- ANON key. That key is subject to RLS, and offers had no anon SELECT
-- policy — so the query returned [] in the browser even though rows
-- existed (the n8n workflow reads via a privileged key that bypasses RLS,
-- which is why it worked there).
--
-- This adds a tightly-scoped policy: anonymous visitors may read ONLY
-- offers that are currently live (is_active = true AND valid_to >= today).
-- Inactive or expired offers stay invisible to the public. The storefront
-- still applies the same filters client-side; this just unblocks the read.
-- ────────────────────────────────────────────────────────────────────

-- 1) Ensure RLS is enabled (no-op if already on).
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- 2) Public read policy — live offers only.
--    Dropped first so re-running picks up any future tweaks to the rule.
DROP POLICY IF EXISTS public_read_active_offers ON public.offers;

CREATE POLICY public_read_active_offers
  ON public.offers
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (valid_to IS NULL OR valid_to >= current_date)
  );

-- 3) Make sure the base table privilege is granted (RLS narrows it).
GRANT SELECT ON public.offers TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- DONE — verify with the anon key (should now return the live offers):
--   SELECT id, title, valid_to, is_active
--   FROM public.offers
--   WHERE owner_id = '<owner_id>'
--   ORDER BY created_at DESC;
-- ════════════════════════════════════════════════════════════════════
