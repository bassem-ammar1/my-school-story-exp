ALTER TABLE public.post_likes ADD COLUMN reaction text NOT NULL DEFAULT 'like';
ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_reaction_check CHECK (reaction IN ('like','love','celebrate','support','inspiring'));
CREATE POLICY "Change own reaction" ON public.post_likes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
COMMENT ON TABLE public.post_likes IS 'One active reaction per user per post (primary key); reaction holds the type.';