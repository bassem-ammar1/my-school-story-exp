CREATE TYPE public.app_role AS ENUM ('student','teacher','school_admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Student',
  avatar_url text,
  grade int,
  age_13_plus boolean NOT NULL DEFAULT false,
  voice_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_id uuid NOT NULL,
  join_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text),1,6)),
  anonymous_mode boolean NOT NULL DEFAULT false,
  allow_school boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.class_members (
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, user_id)
);
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  prompt_text text NOT NULL,
  prompt_image text,
  concept_tokens text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.challenge_answers (
  challenge_id uuid PRIMARY KEY REFERENCES public.challenges(id) ON DELETE CASCADE,
  final_answer text NOT NULL
);
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  step1_text text NOT NULL DEFAULT '',
  step2_text text NOT NULL DEFAULT '',
  step3_text text NOT NULL DEFAULT '',
  step_images jsonb NOT NULL DEFAULT '[]',
  voice_url text,
  voice_transcript text,
  voice_duration_s int,
  concept_token text,
  confidence int,
  confidence_initial int,
  status text NOT NULL DEFAULT 'draft',
  version int NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  rubric jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, student_id)
);
CREATE TABLE public.submission_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  version int NOT NULL,
  step1_text text, step2_text text, step3_text text,
  confidence int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  request_text text,
  hints text[] NOT NULL DEFAULT '{}',
  next_step text,
  praise text,
  blocked_answer_attempt boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'class',
  public_approved boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  session_id uuid,
  step_ref int,
  text text NOT NULL,
  x real, y real,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  UNIQUE (artifact_id, user_id, emoji)
);
CREATE TABLE public.flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  type text NOT NULL,
  source text NOT NULL DEFAULT 'teacher',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.synthesis_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  code text NOT NULL UNIQUE DEFAULT lpad((floor(random()*1000000))::int::text, 6, '0'),
  artifact_ids uuid[] NOT NULL DEFAULT '{}',
  misconception_artifact_id uuid,
  prompts text[] NOT NULL DEFAULT '{}',
  current_index int NOT NULL DEFAULT 0,
  revealed_misconception boolean NOT NULL DEFAULT false,
  transfer_task text,
  transfer_minutes int,
  transfer_started_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE TABLE public.transfer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.synthesis_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  response text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
CREATE TABLE public.micro_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_by uuid NOT NULL,
  student_id uuid NOT NULL,
  artifact_id uuid REFERENCES public.artifacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text NOT NULL,
  duration_min int NOT NULL DEFAULT 5,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.competency_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL,
  description text NOT NULL,
  linked_skill text NOT NULL
);
CREATE TABLE public.badge_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id uuid NOT NULL REFERENCES public.competency_badges(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  artifact_id uuid REFERENCES public.artifacts(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.classes, public.class_members, public.challenges, public.challenge_answers, public.submissions, public.submission_versions, public.artifacts, public.annotations, public.reactions, public.flags, public.synthesis_sessions, public.transfer_responses, public.micro_tasks, public.badge_awards TO authenticated;
GRANT SELECT ON public.user_roles, public.ai_interactions, public.competency_badges, public.analytics_events TO authenticated;
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
GRANT INSERT ON public.analytics_events TO authenticated, anon;
GRANT SELECT ON public.competency_badges TO anon;
GRANT ALL ON public.profiles, public.user_roles, public.classes, public.class_members, public.challenges, public.challenge_answers, public.submissions, public.submission_versions, public.ai_interactions, public.artifacts, public.annotations, public.reactions, public.flags, public.synthesis_sessions, public.transfer_responses, public.micro_tasks, public.competency_badges, public.badge_awards, public.analytics_events TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthesis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.has_school_sso(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = _user_id AND (provider IN ('google','azure') OR provider LIKE 'sso:%'))
$$;
CREATE OR REPLACE FUNCTION public.is_sso_teacher(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'teacher') AND public.has_school_sso(_user_id)
$$;
CREATE OR REPLACE FUNCTION public.is_class_teacher(_user_id uuid, _class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND teacher_id = _user_id) AND public.is_sso_teacher(_user_id)
$$;
CREATE OR REPLACE FUNCTION public.is_class_member(_user_id uuid, _class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_members WHERE class_id = _class_id AND user_id = _user_id)
$$;
CREATE OR REPLACE FUNCTION public.can_view_class(_user_id uuid, _class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_class_member(_user_id, _class_id) OR public.is_class_teacher(_user_id, _class_id)
$$;
CREATE OR REPLACE FUNCTION public.challenge_class(_challenge_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT class_id FROM public.challenges WHERE id = _challenge_id
$$;
CREATE OR REPLACE FUNCTION public.submission_class(_submission_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_id FROM public.submissions s JOIN public.challenges c ON c.id = s.challenge_id WHERE s.id = _submission_id
$$;
CREATE OR REPLACE FUNCTION public.artifact_class(_artifact_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.submission_class(submission_id) FROM public.artifacts WHERE id = _artifact_id
$$;
CREATE OR REPLACE FUNCTION public.can_view_artifact(_user_id uuid, _artifact_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.artifacts a
    JOIN public.submissions s ON s.id = a.submission_id
    JOIN public.challenges c ON c.id = s.challenge_id
    JOIN public.classes k ON k.id = c.class_id
    WHERE a.id = _artifact_id AND (
      public.can_view_class(_user_id, c.class_id)
      OR (a.visibility = 'school' AND k.allow_school)
      OR (a.visibility = 'public' AND a.public_approved)
    )
  )
$$;
CREATE OR REPLACE FUNCTION public.join_class(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO _cid FROM public.classes WHERE join_code = upper(trim(_code));
  IF _cid IS NULL THEN RAISE EXCEPTION 'Class code not found'; END IF;
  INSERT INTO public.class_members (class_id, user_id) VALUES (_cid, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN _cid;
END $$;
CREATE OR REPLACE FUNCTION public.find_session_by_code(_code text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id FROM public.synthesis_sessions s
  WHERE s.code = trim(_code) AND s.ended_at IS NULL AND public.can_view_class(auth.uid(), s.class_id)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'Student'), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "roles read own or admin" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'school_admin'));
CREATE POLICY "admin grants roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'school_admin') AND role <> 'school_admin');
CREATE POLICY "admin revokes roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'school_admin') AND role <> 'school_admin');

CREATE POLICY "classes read" ON public.classes FOR SELECT TO authenticated USING (public.can_view_class(auth.uid(), id) OR teacher_id = auth.uid());
CREATE POLICY "classes create" ON public.classes FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.is_sso_teacher(auth.uid()));
CREATE POLICY "classes update" ON public.classes FOR UPDATE TO authenticated USING (public.is_class_teacher(auth.uid(), id));

CREATE POLICY "members read" ON public.class_members FOR SELECT TO authenticated USING (public.can_view_class(auth.uid(), class_id));
CREATE POLICY "members leave" ON public.class_members FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_class_teacher(auth.uid(), class_id));

CREATE POLICY "challenges read" ON public.challenges FOR SELECT TO authenticated USING (public.can_view_class(auth.uid(), class_id));
CREATE POLICY "challenges write" ON public.challenges FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "challenges update" ON public.challenges FOR UPDATE TO authenticated USING (public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "challenges delete" ON public.challenges FOR DELETE TO authenticated USING (public.is_class_teacher(auth.uid(), class_id));

CREATE POLICY "answers teacher only" ON public.challenge_answers FOR ALL TO authenticated USING (public.is_class_teacher(auth.uid(), public.challenge_class(challenge_id))) WITH CHECK (public.is_class_teacher(auth.uid(), public.challenge_class(challenge_id)));

CREATE POLICY "submissions read" ON public.submissions FOR SELECT TO authenticated USING (
  student_id = auth.uid()
  OR public.is_class_teacher(auth.uid(), public.challenge_class(challenge_id))
  OR (status = 'published' AND EXISTS (SELECT 1 FROM public.artifacts a WHERE a.submission_id = submissions.id AND public.can_view_artifact(auth.uid(), a.id)))
);
CREATE POLICY "submissions insert own" ON public.submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND public.is_class_member(auth.uid(), public.challenge_class(challenge_id)));
CREATE POLICY "submissions update own" ON public.submissions FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "versions read" ON public.submission_versions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND (s.student_id = auth.uid() OR public.is_class_teacher(auth.uid(), public.challenge_class(s.challenge_id)))));
CREATE POLICY "versions insert own" ON public.submission_versions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.student_id = auth.uid()));

CREATE POLICY "ai read" ON public.ai_interactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND (s.student_id = auth.uid() OR public.is_class_teacher(auth.uid(), public.challenge_class(s.challenge_id)))));

CREATE POLICY "artifacts read" ON public.artifacts FOR SELECT TO authenticated USING (public.can_view_artifact(auth.uid(), id));
CREATE POLICY "artifacts publish own" ON public.artifacts FOR INSERT TO authenticated WITH CHECK (visibility = 'class' AND public_approved = false AND EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.student_id = auth.uid()));
CREATE POLICY "artifacts teacher update" ON public.artifacts FOR UPDATE TO authenticated USING (public.is_class_teacher(auth.uid(), public.artifact_class(id)));

CREATE POLICY "annotations read" ON public.annotations FOR SELECT TO authenticated USING (public.can_view_artifact(auth.uid(), artifact_id));
CREATE POLICY "annotations add" ON public.annotations FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.can_view_artifact(auth.uid(), artifact_id));
CREATE POLICY "annotations delete" ON public.annotations FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.is_class_teacher(auth.uid(), public.artifact_class(artifact_id)));

CREATE POLICY "reactions read" ON public.reactions FOR SELECT TO authenticated USING (public.can_view_artifact(auth.uid(), artifact_id));
CREATE POLICY "reactions add" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.can_view_artifact(auth.uid(), artifact_id));
CREATE POLICY "reactions remove" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "flags teacher" ON public.flags FOR ALL TO authenticated USING (public.is_class_teacher(auth.uid(), public.submission_class(submission_id))) WITH CHECK (public.is_class_teacher(auth.uid(), public.submission_class(submission_id)));

CREATE POLICY "sessions read" ON public.synthesis_sessions FOR SELECT TO authenticated USING (public.can_view_class(auth.uid(), class_id));
CREATE POLICY "sessions create" ON public.synthesis_sessions FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "sessions update" ON public.synthesis_sessions FOR UPDATE TO authenticated USING (public.is_class_teacher(auth.uid(), class_id));

CREATE POLICY "transfer read" ON public.transfer_responses FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.synthesis_sessions s WHERE s.id = session_id AND public.is_class_teacher(auth.uid(), s.class_id)));
CREATE POLICY "transfer insert" ON public.transfer_responses FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND EXISTS (SELECT 1 FROM public.synthesis_sessions s WHERE s.id = session_id AND public.is_class_member(auth.uid(), s.class_id)));
CREATE POLICY "transfer update" ON public.transfer_responses FOR UPDATE TO authenticated USING (student_id = auth.uid());

CREATE POLICY "micro read" ON public.micro_tasks FOR SELECT TO authenticated USING (student_id = auth.uid() OR (assigned_by = auth.uid() AND public.is_sso_teacher(auth.uid())));
CREATE POLICY "micro assign" ON public.micro_tasks FOR INSERT TO authenticated WITH CHECK (assigned_by = auth.uid() AND public.is_sso_teacher(auth.uid()));
CREATE POLICY "micro update" ON public.micro_tasks FOR UPDATE TO authenticated USING (student_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "badges read" ON public.competency_badges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "awards read" ON public.badge_awards FOR SELECT TO authenticated USING (true);
CREATE POLICY "awards issue" ON public.badge_awards FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND public.is_sso_teacher(auth.uid()));

CREATE POLICY "events insert" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "events read teachers" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_sso_teacher(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.annotations, public.transfer_responses, public.synthesis_sessions;

CREATE POLICY "thinking media read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'thinking-media');
CREATE POLICY "thinking media upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'thinking-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "thinking media delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'thinking-media' AND (storage.foldername(name))[1] = auth.uid()::text);