ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS mission text,
  ADD COLUMN IF NOT EXISTS student_count integer,
  ADD COLUMN IF NOT EXISTS teacher_count integer,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

CREATE TABLE public.school_follows (
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (school_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.school_follows TO authenticated;
GRANT ALL ON public.school_follows TO service_role;
ALTER TABLE public.school_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows readable" ON public.school_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follow self" ON public.school_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unfollow self" ON public.school_follows FOR DELETE TO authenticated USING (auth.uid() = user_id);