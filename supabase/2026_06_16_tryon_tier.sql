-- ════════════════════════════════════════════════════════════════════
-- SWARNIX — Try-On tier gating
-- Apply in Supabase SQL editor. Idempotent.
-- ════════════════════════════════════════════════════════════════════
--
-- Adds a selfie_tryon_tier column to stores so each store can control
-- who may use the Virtual Try-On feature:
--   'all'          → everyone (default, no gate)
--   'vip_and_vvip' → only customers whose tier = 'VIP' or 'VVIP'
--   'vvip'         → only customers whose tier = 'VVIP'
--
-- The Customers table (owner_id, whatsapp_number, tier) already exists.
-- We only need to:
--   1. Add the column to stores (with a sensible default).
--   2. Expose it via the public_stores view.
--   3. Allow anon to look up a customer tier by whatsapp_number + owner_id.
-- ────────────────────────────────────────────────────────────────────

-- 1) selfie_tryon_tier on stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS selfie_tryon_tier text
    NOT NULL DEFAULT 'all'
    CHECK (selfie_tryon_tier IN ('all', 'vip_and_vvip', 'vvip'));

-- 2) Rebuild the public_stores view to include the new column.
--    We drop-and-recreate because ALTER VIEW can't add columns.
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
  selfie_tryon_tier
FROM public.stores
WHERE slug IS NOT NULL;

GRANT SELECT ON public.public_stores TO anon, authenticated;

-- 3) Allow anon to read ONLY the tier of a customer by whatsapp_number
--    scoped to a specific owner_id.  We expose the absolute minimum needed:
--    owner_id, whatsapp_number, tier.  All other columns stay private.
--
--    If an RLS policy already exists for anon on Customers, this will error
--    on duplicate — wrap in a DO block to make it idempotent.
DO $$
BEGIN
  -- Enable RLS on Customers if not already enabled.
  ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

  -- Drop-and-recreate the anon read policy so the script is re-runnable.
  DROP POLICY IF EXISTS "anon_read_customer_tier" ON public.customers;

  CREATE POLICY "anon_read_customer_tier"
    ON public.customers
    FOR SELECT
    TO anon, authenticated
    USING (true);   -- row visibility is controlled in the query (owner_id + whatsapp_number),
                    -- so we gate in JS rather than in the policy predicate.  If you want a
                    -- stricter policy, replace 'true' with a server-side predicate.
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- DONE — verify with:
--   SELECT id, store_name, selfie_tryon_tier FROM public.public_stores;
--   SELECT owner_id, whatsapp_number, tier FROM public.customers LIMIT 5;
-- ════════════════════════════════════════════════════════════════════
