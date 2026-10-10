DROP POLICY "Write own posts" ON public.posts;
CREATE POLICY "Write own posts" ON public.posts FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND hidden = false
  AND author_name IS NULL
  AND author_avatar IS NULL
  AND author_subtitle IS NULL
  AND (school_id IS NULL OR EXISTS (
    SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_id = auth.uid()
  ))
);