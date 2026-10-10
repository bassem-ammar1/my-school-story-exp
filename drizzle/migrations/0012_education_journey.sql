CREATE TABLE public.education_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, school_name text NOT NULL CHECK (length(trim(school_name)) BETWEEN 2 AND 120), grade integer NOT NULL CHECK (grade BETWEEN 1 AND 12), start_year integer NOT NULL CHECK (start_year BETWEEN 1900 AND 2200), end_year integer NOT NULL CHECK (end_year > start_year AND end_year <= 2201), status text NOT NULL DEFAULT 'previous' CHECK (status IN ('previous','current','planned')), shared boolean NOT NULL DEFAULT false, is_example boolean NOT NULL DEFAULT false);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.education_entries TO authenticated;
GRANT ALL ON public.education_entries TO service_role;
ALTER TABLE public.education_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education owner or shared read" ON public.education_entries FOR SELECT TO authenticated USING (user_id=auth.uid() OR shared);
CREATE POLICY "education own insert" ON public.education_entries FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY "education own update" ON public.education_entries FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY "education own delete" ON public.education_entries FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE UNIQUE INDEX education_one_current ON public.education_entries(user_id) WHERE status='current';