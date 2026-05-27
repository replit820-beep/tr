
CREATE TABLE public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  message TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_events_order_id_created ON public.order_events(order_id, created_at);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Customers view events for their own orders
CREATE POLICY "users view own order events"
ON public.order_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_events.order_id AND o.user_id = auth.uid()
  )
);

-- Admins full read
CREATE POLICY "admins view all order events"
ON public.order_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can insert/update/delete
CREATE POLICY "admins insert order events"
ON public.order_events FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update order events"
ON public.order_events FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete order events"
ON public.order_events FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Auto-log on new order
CREATE OR REPLACE FUNCTION public.log_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_events (order_id, status, message, created_by)
  VALUES (
    NEW.id,
    NEW.status,
    'Order placed — payment reference received, awaiting verification.',
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_log_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_created();

-- Auto-log on status change
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
      WHEN 'pending' THEN 'Moved back to pending — re-checking payment.'
      WHEN 'in_progress' THEN 'Payment verified. Operator has started working on your request.'
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

CREATE TRIGGER trg_orders_log_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();
