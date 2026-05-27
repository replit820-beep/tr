-- Ensure enum has new values (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='order_status' AND e.enumlabel='waiting_for_approval') THEN
    ALTER TYPE public.order_status ADD VALUE 'waiting_for_approval' BEFORE 'pending';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='order_status' AND e.enumlabel='approved') THEN
    ALTER TYPE public.order_status ADD VALUE 'approved' AFTER 'waiting_for_approval';
  END IF;
END$$;
