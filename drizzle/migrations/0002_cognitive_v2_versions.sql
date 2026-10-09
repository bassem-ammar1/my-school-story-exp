ALTER TABLE public.cognitive_attempts ALTER COLUMN questionnaire_version SET DEFAULT 'self-reflection-v2', ALTER COLUMN scoring_version SET DEFAULT 'habits-v2';
CREATE OR REPLACE FUNCTION public.guard_cognitive_attempt() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Attempt identity cannot change'; END IF;
  IF OLD.status = 'submitted' AND (NEW.responses IS DISTINCT FROM OLD.responses OR NEW.goal IS DISTINCT FROM OLD.goal OR NEW.status IS DISTINCT FROM OLD.status OR NEW.questionnaire_version IS DISTINCT FROM OLD.questionnaire_version OR NEW.scoring_version IS DISTINCT FROM OLD.scoring_version OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) THEN RAISE EXCEPTION 'Submitted responses cannot change; start a retake'; END IF;
 END IF;
 IF NOT (NEW.questionnaire_version = 'self-reflection-v2' AND NEW.scoring_version = 'habits-v2')
    AND NOT (TG_OP = 'UPDATE' AND OLD.status = 'submitted' AND NEW.questionnaire_version = 'self-reflection-v1' AND NEW.scoring_version = 'habits-v1') THEN
   RAISE EXCEPTION 'Unsupported assessment version'; END IF;
 IF jsonb_typeof(NEW.responses) <> 'object' OR length(NEW.goal) > 300 THEN RAISE EXCEPTION 'Invalid assessment response'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_each(NEW.responses) e WHERE jsonb_typeof(e.value) <> 'number' OR e.value::text NOT IN ('1','2','3','4','5')) THEN RAISE EXCEPTION 'Answers must be whole numbers from 1 to 5'; END IF;
 IF TG_OP = 'INSERT' AND NEW.status <> 'draft' THEN RAISE EXCEPTION 'New attempts must be drafts'; END IF;
 IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status = 'draft') THEN NEW.submitted_at := now(); END IF;
 IF NEW.status = 'draft' THEN NEW.submitted_at := NULL; END IF;
 NEW.updated_at := now();
 RETURN NEW;
END; $$;