CREATE OR REPLACE FUNCTION public.my_age_13_plus() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT coalesce((SELECT date_of_birth<=current_date-interval '13 years' FROM public.student_safety WHERE user_id=auth.uid()),false) $$;
REVOKE ALL ON FUNCTION public.my_age_13_plus() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_age_13_plus() TO authenticated;
CREATE OR REPLACE FUNCTION public.current_school_labels(_ids uuid[]) RETURNS TABLE(user_id uuid,school_name text,grade integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT DISTINCT ON (e.user_id) e.user_id,e.school_name,e.grade FROM public.education_entries e WHERE auth.uid() IS NOT NULL AND e.user_id=ANY(_ids) AND e.status='current' AND (e.shared OR e.user_id=auth.uid()) ORDER BY e.user_id,e.start_year DESC
$$;
REVOKE ALL ON FUNCTION public.current_school_labels(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.current_school_labels(uuid[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.guard_voice_permission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF (NEW.voice_url IS NOT NULL AND NEW.voice_url IS DISTINCT FROM OLD.voice_url) OR (NEW.voice_transcript IS NOT NULL AND NEW.voice_transcript IS DISTINCT FROM OLD.voice_transcript) THEN
 IF NOT EXISTS(SELECT 1 FROM public.student_safety WHERE user_id=NEW.student_id AND date_of_birth<=current_date-interval '13 years') THEN RAISE EXCEPTION 'Voice notes require verified age and guardian permission'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_voice_permission BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.guard_voice_permission();
COMMENT ON COLUMN public.profiles.age_13_plus IS 'DEPRECATED: derive age through my_age_13_plus and private student_safety DOB';
COMMENT ON COLUMN public.profiles.voice_consent IS 'DEPRECATED: student cannot self-attest guardian consent';