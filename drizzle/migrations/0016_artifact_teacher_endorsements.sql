ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS endorsed_by uuid,
  ADD COLUMN IF NOT EXISTS endorsed_at timestamptz,
  ADD COLUMN IF NOT EXISTS endorsement_note text;

DROP POLICY IF EXISTS "artifacts publish own" ON public.artifacts;
CREATE POLICY "artifacts publish own" ON public.artifacts FOR INSERT TO authenticated
  WITH CHECK (visibility = 'class' AND public_approved = false AND endorsed_by IS NULL AND endorsed_at IS NULL AND endorsement_note IS NULL
    AND EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = artifacts.submission_id AND s.student_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_artifact_endorsement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.endorsed_by IS DISTINCT FROM OLD.endorsed_by OR NEW.endorsement_note IS DISTINCT FROM OLD.endorsement_note THEN
    IF NEW.endorsed_by IS NOT NULL THEN
      IF NEW.endorsed_by <> auth.uid() OR NOT public.is_class_teacher(auth.uid(), public.artifact_class(NEW.id)) THEN
        RAISE EXCEPTION 'Only this class''s teacher can endorse';
      END IF;
      NEW.endorsed_at := now();
      NEW.endorsement_note := left(NEW.endorsement_note, 300);
    ELSE
      NEW.endorsed_at := NULL;
      NEW.endorsement_note := NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_artifact_endorsement ON public.artifacts;
CREATE TRIGGER guard_artifact_endorsement BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.guard_artifact_endorsement();