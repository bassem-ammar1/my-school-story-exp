CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid(),
  target_type text NOT NULL CHECK (target_type IN ('post','artifact','comment','user')),
  target_id text NOT NULL,
  target_label text,
  reason text NOT NULL CHECK (reason IN ('bullying','inappropriate','spam','privacy','other')),
  details text CHECK (char_length(details) <= 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','resolved','escalated')),
  admin_note text CHECK (char_length(admin_note) <= 500),
  handled_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Report as self" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND status = 'pending' AND admin_note IS NULL AND handled_by IS NULL);
CREATE POLICY "See own or admin all" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'school_admin'));
CREATE POLICY "Admins moderate" ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'school_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'school_admin'));
CREATE INDEX reports_status_idx ON public.reports(status, created_at);