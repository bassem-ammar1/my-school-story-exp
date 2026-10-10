CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid DEFAULT auth.uid(),
  author_name text,
  author_avatar text,
  author_subtitle text,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts, public.post_likes, public.post_comments TO authenticated;
GRANT ALL ON public.posts, public.post_likes, public.post_comments TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read visible posts" ON public.posts FOR SELECT TO authenticated
  USING (NOT hidden OR author_id = auth.uid() OR public.has_role(auth.uid(),'school_admin'));
CREATE POLICY "Write own posts" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND hidden = false AND author_name IS NULL AND author_avatar IS NULL AND author_subtitle IS NULL);
CREATE POLICY "Admins moderate posts" ON public.posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'school_admin')) WITH CHECK (public.has_role(auth.uid(),'school_admin'));
CREATE POLICY "Delete own or admin" ON public.posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'school_admin'));

CREATE POLICY "Read likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Like as self" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Unlike own" ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Read visible comments" ON public.post_comments FOR SELECT TO authenticated
  USING (NOT hidden OR author_id = auth.uid() OR public.has_role(auth.uid(),'school_admin'));
CREATE POLICY "Comment as self" ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND hidden = false);
CREATE POLICY "Admins moderate comments" ON public.post_comments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'school_admin')) WITH CHECK (public.has_role(auth.uid(),'school_admin'));
CREATE POLICY "Delete own comment or admin" ON public.post_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'school_admin'));

CREATE INDEX posts_created_idx ON public.posts(created_at DESC);
CREATE INDEX post_comments_post_idx ON public.post_comments(post_id, created_at);

INSERT INTO public.posts (id, author_id, author_name, author_avatar, author_subtitle, body, created_at) VALUES
('00000000-0000-4000-a000-000000000001', NULL, 'Cedar Hills School', '🏫', 'School · Beirut', 'Science fair next Friday! 🔬 Grade 6–8 students: bring your experiments and explain your thinking to the judges. Sign-ups close Wednesday.', now() - interval '2 hours'),
('00000000-0000-4000-a000-000000000002', NULL, 'Lina Khoury', '🧑‍🎓', 'Grade 7 · Cedar Hills School', 'How I solved the fraction puzzle: I drew the pizza as 8 slices first, then noticed 3/4 is the same as 6/8. Drawing it made it click! 🍕', now() - interval '5 hours'),
('00000000-0000-4000-a000-000000000003', NULL, 'Ms. Rania Haddad', '👩‍🏫', 'Math teacher · Cedar Hills School', 'New challenge is live 🎯 Try this week''s assessment on patterns. Show every step — the reasoning matters more than the answer.', now() - interval '1 day');