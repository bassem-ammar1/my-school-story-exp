CREATE TABLE public.teacher_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  school_name text NOT NULL CHECK (length(school_name) BETWEEN 2 AND 120),
  note text CHECK (note IS NULL OR length(note) <= 300),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.teacher_requests TO authenticated;
GRANT ALL ON public.teacher_requests TO service_role;
ALTER TABLE public.teacher_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read" ON public.teacher_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'school_admin'));
CREATE POLICY "request own" ON public.teacher_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND NOT public.has_role(auth.uid(),'teacher'));
CREATE POLICY "withdraw own pending or rejected" ON public.teacher_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status <> 'approved');

CREATE OR REPLACE FUNCTION public.review_teacher_request(_request_id uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'school_admin') THEN RAISE EXCEPTION 'Only school admins can review requests'; END IF;
  UPDATE public.teacher_requests SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = _request_id AND status = 'pending' RETURNING user_id INTO _uid;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Request not found or already reviewed'; END IF;
  IF _approve THEN INSERT INTO public.user_roles(user_id, role) VALUES (_uid,'teacher') ON CONFLICT DO NOTHING; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_teacher_request(uuid,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.review_teacher_request(uuid,boolean) TO authenticated;