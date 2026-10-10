ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.challenge_preview(_id uuid)
RETURNS TABLE(id uuid, title text, prompt_text text, prompt_image text, concept_tokens text[], eligible boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.title, c.prompt_text, c.prompt_image, c.concept_tokens,
         public.is_class_member(auth.uid(), c.class_id) OR public.is_class_teacher(auth.uid(), c.class_id)
  FROM public.challenges c
  WHERE c.id = _id AND auth.uid() IS NOT NULL
    AND (public.is_class_member(auth.uid(), c.class_id) OR public.is_class_teacher(auth.uid(), c.class_id)
         OR EXISTS (SELECT 1 FROM public.posts p WHERE p.challenge_id = c.id AND p.hidden = false));
$$;
REVOKE ALL ON FUNCTION public.challenge_preview(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.challenge_preview(uuid) TO authenticated;