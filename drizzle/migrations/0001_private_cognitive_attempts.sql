CREATE TABLE public.cognitive_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 student_id uuid NOT NULL,
 questionnaire_version text NOT NULL DEFAULT 'self-reflection-v1',
 scoring_version text NOT NULL DEFAULT 'habits-v1',
 responses jsonb NOT NULL DEFAULT '{}'::jsonb,
 goal text NOT NULL DEFAULT '',
 use_for_coach boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 submitted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cognitive_attempts TO authenticated;
GRANT ALL ON public.cognitive_attempts TO service_role;
ALTER TABLE public.cognitive_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY cognitive_owner_read ON public.cognitive_attempts FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY cognitive_owner_insert ON public.cognitive_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND status = 'draft');
CREATE POLICY cognitive_owner_update ON public.cognitive_attempts FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY cognitive_owner_delete ON public.cognitive_attempts FOR DELETE TO authenticated USING (student_id = auth.uid());
CREATE INDEX cognitive_attempts_owner_date ON public.cognitive_attempts(student_id, created_at DESC);
CREATE FUNCTION public.guard_cognitive_attempt() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Attempt identity cannot change'; END IF;
  IF OLD.status = 'submitted' AND (NEW.responses IS DISTINCT FROM OLD.responses OR NEW.goal IS DISTINCT FROM OLD.goal OR NEW.status IS DISTINCT FROM OLD.status OR NEW.questionnaire_version IS DISTINCT FROM OLD.questionnaire_version OR NEW.scoring_version IS DISTINCT FROM OLD.scoring_version OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) THEN RAISE EXCEPTION 'Submitted responses cannot change; start a retake'; END IF;
 END IF;
 IF NEW.questionnaire_version <> 'self-reflection-v1' OR NEW.scoring_version <> 'habits-v1' THEN RAISE EXCEPTION 'Unsupported assessment version'; END IF;
 IF jsonb_typeof(NEW.responses) <> 'object' OR length(NEW.goal) > 300 THEN RAISE EXCEPTION 'Invalid assessment response'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_each(NEW.responses) e WHERE jsonb_typeof(e.value) <> 'number' OR e.value::text NOT IN ('1','2','3','4','5')) THEN RAISE EXCEPTION 'Answers must be whole numbers from 1 to 5'; END IF;
 IF TG_OP = 'INSERT' AND NEW.status <> 'draft' THEN RAISE EXCEPTION 'New attempts must be drafts'; END IF;
 IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status = 'draft') THEN NEW.submitted_at := now(); END IF;
 IF NEW.status = 'draft' THEN NEW.submitted_at := NULL; END IF;
 NEW.updated_at := now();
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_cognitive_attempt BEFORE INSERT OR UPDATE ON public.cognitive_attempts FOR EACH ROW EXECUTE FUNCTION public.guard_cognitive_attempt();
COMMENT ON TABLE public.cognitive_attempts IS 'Private student self-reflection; school roles confer no access. Submitted answers immutable; coach permission can be revoked; owner may delete.';