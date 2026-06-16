-- ════════════════════════════════════════════════════════════════════
-- SWARNIX — customers.added_via column
-- Apply in Supabase SQL editor. Idempotent.
-- ════════════════════════════════════════════════════════════════════
--
-- Tracks how a customer record was created:
--   'manual'    → owner added the customer themselves (default)
--   'whatsapp'  → customer came in via WhatsApp flow
--   'website'   → customer submitted the AI chat intake form on the storefront
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS added_via text
    NOT NULL DEFAULT 'manual'
    CHECK (added_via IN ('manual', 'whatsapp', 'website'));

-- ════════════════════════════════════════════════════════════════════
-- DONE — verify with:
--   SELECT id, name, added_via FROM public.customers LIMIT 10;
-- ════════════════════════════════════════════════════════════════════
