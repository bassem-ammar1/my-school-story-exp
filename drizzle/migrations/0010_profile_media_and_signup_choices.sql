ALTER TABLE public.profiles ADD COLUMN cover_url text;
ALTER TABLE public.posts ADD COLUMN image_url text;
ALTER TABLE public.posts ADD COLUMN image_alt text;
ALTER TABLE public.teacher_requests ADD COLUMN requested_role text NOT NULL DEFAULT 'teacher' CHECK (requested_role IN ('teacher','school'));
CREATE TABLE public.account_preferences (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, signup_role text NOT NULL DEFAULT 'student' CHECK (signup_role IN ('student','teacher','school')));
GRANT SELECT ON public.account_preferences TO authenticated;
GRANT ALL ON public.account_preferences TO service_role;
ALTER TABLE public.account_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own signup preference" ON public.account_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.set_signup_role(_role text, _school_name text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
 IF _role NOT IN ('student','teacher','school') THEN RAISE EXCEPTION 'Invalid account choice'; END IF;
 IF _role <> 'student' AND length(trim(_school_name)) < 2 THEN RAISE EXCEPTION 'Enter your school name'; END IF;
 INSERT INTO public.account_preferences(user_id,signup_role) VALUES(auth.uid(),_role) ON CONFLICT(user_id) DO UPDATE SET signup_role=excluded.signup_role;
 IF _role <> 'student' THEN
 INSERT INTO public.teacher_requests(user_id,school_name,requested_role) VALUES(auth.uid(),left(trim(_school_name),120),_role) ON CONFLICT(user_id) DO NOTHING;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_signup_role(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_signup_role(text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _choice text;
BEGIN
 INSERT INTO public.profiles(id,display_name,avatar_url) VALUES(NEW.id,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name',split_part(NEW.email,'@',1),'Student'),NEW.raw_user_meta_data->>'avatar_url') ON CONFLICT DO NOTHING;
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'student') ON CONFLICT DO NOTHING;
 _choice := COALESCE(NEW.raw_user_meta_data->>'signup_role','student');
 IF _choice NOT IN ('student','teacher','school') THEN _choice := 'student'; END IF;
 INSERT INTO public.account_preferences(user_id,signup_role) VALUES(NEW.id,_choice) ON CONFLICT DO NOTHING;
 IF _choice <> 'student' AND length(trim(COALESCE(NEW.raw_user_meta_data->>'school_name',''))) >= 2 THEN
 INSERT INTO public.teacher_requests(user_id,school_name,requested_role) VALUES(NEW.id,left(trim(NEW.raw_user_meta_data->>'school_name'),120),_choice) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.review_teacher_request(_request_id uuid,_approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _requested text;
BEGIN
 IF NOT public.has_role(auth.uid(),'school_admin') THEN RAISE EXCEPTION 'Only school admins can review requests'; END IF;
 UPDATE public.teacher_requests SET status=CASE WHEN _approve THEN 'approved' ELSE 'rejected' END, reviewed_by=auth.uid(),reviewed_at=now() WHERE id=_request_id AND status='pending' RETURNING user_id,requested_role INTO _uid,_requested;
 IF _uid IS NULL THEN RAISE EXCEPTION 'Request not found or already reviewed'; END IF;
 IF _approve THEN INSERT INTO public.user_roles(user_id,role) VALUES(_uid,CASE WHEN _requested='school' THEN 'school_admin'::public.app_role ELSE 'teacher'::public.app_role END) ON CONFLICT DO NOTHING; END IF;
END $$;