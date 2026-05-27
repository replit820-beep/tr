ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'waiting_for_approval';

DROP POLICY IF EXISTS "orders_update_own_pending" ON public.orders;
CREATE POLICY "orders_update_own_pending" ON public.orders
  FOR UPDATE USING (
    auth.uid() = user_id AND status IN ('waiting_for_approval', 'pending')
  );

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    msg := CASE NEW.status
      WHEN 'waiting_for_approval' THEN 'Order placed. Waiting for admin to verify your payment.'
      WHEN 'approved' THEN 'Payment approved. Your order is queued.'
      WHEN 'pending' THEN 'Order is pending — admin is re-checking your payment.'
      WHEN 'in_progress' THEN 'Operator has started working on your request.'
      WHEN 'completed' THEN 'Request completed successfully. Please verify on your end.'
      WHEN 'cancelled' THEN 'Order cancelled. If amount was paid, refund will be initiated within 24–48h.'
      ELSE 'Status updated.'
    END;
    INSERT INTO public.order_events (order_id, status, message, created_by)
    VALUES (NEW.id, NEW.status, msg, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
