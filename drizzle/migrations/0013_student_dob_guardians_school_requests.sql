CREATE TABLE public.student_safety (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, date_of_birth date NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.student_safety TO authenticated;
GRANT ALL ON public.student_safety TO service_role;
ALTER TABLE public.student_safety ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own private birth date" ON public.student_safety FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.guardian_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, email text NOT NULL, guardian_id uuid, accepted_at timestamptz, student_approved boolean NOT NULL DEFAULT false, guardian_approved boolean NOT NULL DEFAULT false, UNIQUE(student_id,email));
GRANT SELECT ON public.guardian_connections TO authenticated;
GRANT ALL ON public.guardian_connections TO service_role;
ALTER TABLE public.guardian_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own guardian connection" ON public.guardian_connections FOR SELECT TO authenticated USING(student_id=auth.uid() OR guardian_id=auth.uid());
CREATE TABLE public.schools (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, owner_id uuid NOT NULL REFERENCES public.profiles(id), test_only boolean NOT NULL DEFAULT true, verified boolean NOT NULL DEFAULT false);
GRANT SELECT ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school directory" ON public.schools FOR SELECT TO authenticated USING(true);
CREATE TABLE public.school_enrollments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), education_id uuid NOT NULL UNIQUE REFERENCES public.education_entries(id) ON DELETE CASCADE, school_id uuid NOT NULL REFERENCES public.schools(id), student_id uuid NOT NULL REFERENCES public.profiles(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')), reviewed_at timestamptz, student_approved boolean NOT NULL DEFAULT false);
GRANT SELECT ON public.school_enrollments TO authenticated;
GRANT ALL ON public.school_enrollments TO service_role;
ALTER TABLE public.school_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student or own school enrollment" ON public.school_enrollments FOR SELECT TO authenticated USING(student_id=auth.uid() OR EXISTS(SELECT 1 FROM public.schools s WHERE s.id=school_id AND s.owner_id=auth.uid()));
CREATE OR REPLACE FUNCTION public.set_student_safety(_dob date, _emails text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 IF _dob IS NULL OR _dob>current_date OR _dob<current_date-interval '120 years' THEN RAISE EXCEPTION 'Enter a valid birth date'; END IF;
 IF coalesce(array_length(_emails,1),0) NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Add one to five guardian emails'; END IF;
 IF EXISTS(SELECT 1 FROM public.student_safety WHERE user_id=auth.uid() AND date_of_birth<>_dob) THEN RAISE EXCEPTION 'Birth date is already recorded'; END IF;
 FOREACH e IN ARRAY _emails LOOP
 IF length(e)>254 OR trim(e)!~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' OR lower(trim(e))=lower(coalesce(auth.jwt()->>'email','')) THEN RAISE EXCEPTION 'Enter a guardian email different from your own'; END IF;
 END LOOP;
 INSERT INTO public.student_safety(user_id,date_of_birth) VALUES(auth.uid(),_dob) ON CONFLICT DO NOTHING;
 FOREACH e IN ARRAY _emails LOOP
 INSERT INTO public.guardian_connections(student_id,email) VALUES(auth.uid(),lower(trim(e))) ON CONFLICT DO NOTHING;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.set_student_safety(date,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_student_safety(date,text[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.freeze_student_consent() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND (NEW.age_13_plus IS DISTINCT FROM OLD.age_13_plus OR NEW.voice_consent IS DISTINCT FROM OLD.voice_consent) THEN RAISE EXCEPTION 'Age and guardian consent cannot be changed from your profile'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER freeze_student_consent BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.freeze_student_consent();
CREATE OR REPLACE FUNCTION public.capture_signup_safety() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d date; e text;
BEGIN
 IF NEW.raw_user_meta_data->>'date_of_birth' IS NULL THEN RETURN NEW; END IF;
 d := (NEW.raw_user_meta_data->>'date_of_birth')::date;
 IF d>current_date OR d<current_date-interval '120 years' THEN RAISE EXCEPTION 'Invalid birth date'; END IF;
 INSERT INTO public.student_safety(user_id,date_of_birth) VALUES(NEW.id,d) ON CONFLICT DO NOTHING;
 FOR e IN SELECT jsonb_array_elements_text(coalesce(NEW.raw_user_meta_data->'guardian_emails','[]'::jsonb)) LIMIT 5 LOOP
 IF length(e)<=254 AND e~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' AND lower(trim(e))<>lower(NEW.email) THEN
 INSERT INTO public.guardian_connections(student_id,email) VALUES(NEW.id,lower(trim(e))) ON CONFLICT DO NOTHING;
 END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER zz_capture_signup_safety AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.capture_signup_safety();
CREATE OR REPLACE FUNCTION public.accept_guardian_connection(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e text;
BEGIN
 SELECT email INTO e FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL;
 IF e IS NULL THEN RAISE EXCEPTION 'Verify your email first'; END IF;
 UPDATE public.guardian_connections SET guardian_id=auth.uid(),accepted_at=now() WHERE id=_id AND email=lower(e) AND student_id<>auth.uid() AND guardian_id IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found for your verified email'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.accept_guardian_connection(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accept_guardian_connection(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.set_guardian_approval(_id uuid,_approved boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.guardian_connections SET student_approved=CASE WHEN student_id=auth.uid() THEN _approved ELSE student_approved END,guardian_approved=CASE WHEN guardian_id=auth.uid() AND accepted_at IS NOT NULL THEN _approved ELSE guardian_approved END WHERE id=_id AND (student_id=auth.uid() OR guardian_id=auth.uid());
 IF NOT FOUND THEN RAISE EXCEPTION 'Connection not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_guardian_approval(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_guardian_approval(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.request_school_enrollment(_education uuid,_school uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.education_entries WHERE id=_education AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Education not found'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.schools WHERE id=_school) THEN RAISE EXCEPTION 'School not found'; END IF;
 INSERT INTO public.school_enrollments(education_id,school_id,student_id) VALUES(_education,_school,auth.uid()) ON CONFLICT(education_id) DO UPDATE SET school_id=excluded.school_id,status='pending',reviewed_at=NULL,student_approved=false;
END $$;
REVOKE ALL ON FUNCTION public.request_school_enrollment(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_school_enrollment(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.review_school_enrollment(_id uuid,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.school_enrollments r SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now() WHERE r.id=_id AND r.status='pending' AND EXISTS(SELECT 1 FROM public.schools s WHERE s.id=r.school_id AND s.owner_id=auth.uid());
 IF NOT FOUND THEN RAISE EXCEPTION 'Pending enrollment not found for your school'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_school_enrollment(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_school_enrollment(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.reset_education_approval() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.school_name IS DISTINCT FROM OLD.school_name OR NEW.grade IS DISTINCT FROM OLD.grade OR NEW.start_year IS DISTINCT FROM OLD.start_year OR NEW.end_year IS DISTINCT FROM OLD.end_year OR NEW.status IS DISTINCT FROM OLD.status THEN
 UPDATE public.school_enrollments SET status='pending',reviewed_at=NULL,student_approved=false WHERE education_id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER reset_education_approval AFTER UPDATE ON public.education_entries FOR EACH ROW EXECUTE FUNCTION public.reset_education_approval();