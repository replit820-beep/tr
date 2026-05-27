
-- Complaint status enum
DO $$ BEGIN
  CREATE TYPE public.complaint_status AS ENUM ('open', 'in_review', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.complaint_category AS ENUM ('order_issue', 'payment', 'delay', 'refund', 'account', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID NULL,
  category public.complaint_category NOT NULL DEFAULT 'other',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.complaint_status NOT NULL DEFAULT 'open',
  admin_response TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "complaints_select_own" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "complaints_insert_own" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "complaints_update_own_open" ON public.complaints FOR UPDATE USING (auth.uid() = user_id AND status = 'open');

CREATE POLICY "admins view all complaints" ON public.complaints FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update all complaints" ON public.complaints FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete complaints" ON public.complaints FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_complaints_user ON public.complaints(user_id, created_at DESC);
CREATE INDEX idx_complaints_status ON public.complaints(status, created_at DESC);
