-- ════════════════════════════════════════════════════════════════════
-- SWARNIX — customer REVIEWS + public storefront read/insert access
-- Apply in Supabase SQL editor. Idempotent (safe to re-run).
-- ════════════════════════════════════════════════════════════════════
--
-- The storefront's "Why <store>" trust band renders an auto-sliding review
-- carousel — but ONLY from REAL, store-approved reviews (never seeded /
-- fabricated). This migration creates the table the storefront reads via
-- getStorefrontReviews() and exposes:
--   • a tightly-scoped anon READ policy: the public may read only reviews a
--     store owner has APPROVED (status = 'approved'); and
--   • an anon INSERT policy so CUSTOMERS can submit a review from the
--     storefront — but always as status = 'pending', so the jeweller
--     moderates each one.
--
-- Moderation uses a single `status` column with three states:
--     'pending'  → just submitted, awaiting the owner's decision
--     'approved' → owner approved; shows on the storefront carousel
--     'rejected' → owner declined; never shown publicly
-- (Earlier drafts used a boolean is_published; the upgrade block below
--  migrates that to `status` automatically if present.)
-- ────────────────────────────────────────────────────────────────────

-- 1) Table — one row per customer review, scoped to a store via owner_id.
CREATE TABLE IF NOT EXISTS public.reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL,
  customer_name text NOT NULL,
  rating        smallint CHECK (rating BETWEEN 1 AND 5),
  body          text NOT NULL,
  avatar_url    text,
  status        text NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 1a) Ensure the status column exists (no-op on fresh installs).
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 1b) Upgrade path: if a previous version created a boolean is_published,
--     backfill status from it, then drop it so `status` is the single
--     source of truth.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_published'
  ) THEN
    UPDATE public.reviews
      SET status = CASE WHEN is_published THEN 'approved' ELSE 'pending' END;
    ALTER TABLE public.reviews DROP COLUMN is_published;
  END IF;
END $$;

-- 1c) Constrain status to the three valid states.
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_status_chk;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_status_chk CHECK (status IN ('pending', 'approved', 'rejected'));

-- 1d) Fast lookup of a store's reviews by status, newest first.
DROP INDEX IF EXISTS reviews_owner_published_idx;   -- old boolean index, if any
CREATE INDEX IF NOT EXISTS reviews_owner_status_idx
  ON public.reviews (owner_id, status, created_at DESC);

-- 2) RLS — on; public reads only APPROVED rows.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_published_reviews ON public.reviews;  -- old name, if any
DROP POLICY IF EXISTS public_read_approved_reviews ON public.reviews;
CREATE POLICY public_read_approved_reviews
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- 3) Customer-submitted reviews — anon may INSERT, but only as 'pending'
--    and within sane bounds. The public can never self-approve (WITH CHECK
--    forbids any status other than 'pending'); approval/rejection happens
--    in the admin app.
DROP POLICY IF EXISTS public_insert_pending_reviews ON public.reviews;
CREATE POLICY public_insert_pending_reviews
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND rating BETWEEN 1 AND 5
    AND char_length(btrim(customer_name)) BETWEEN 1 AND 80
    AND char_length(btrim(body)) BETWEEN 1 AND 2000
  );

-- 4) Base privileges (RLS narrows them: anon reads only approved rows and
--    inserts only pending rows).
GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- DONE.
-- Customers submit reviews from the storefront → status = 'pending'.
-- Owner moderates:
--   approve →  UPDATE public.reviews SET status = 'approved' WHERE id = '<id>';
--   reject  →  UPDATE public.reviews SET status = 'rejected' WHERE id = '<id>';
--
-- Verify anon read (should return only approved rows):
--   SELECT id, customer_name, rating, status FROM public.reviews
--   WHERE owner_id = '<owner_id>' ORDER BY created_at DESC;
-- ════════════════════════════════════════════════════════════════════
