CREATE OR REPLACE FUNCTION public.is_hurtful_text(_t text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(coalesce(_t,'')) ~ '\m(stupid|idiot|idiots|dumb|ugly|loser|losers|fat|worthless|useless|pathetic|moron|retard|retarded|freak|weirdo|trash|failure|disgusting|hate you|shut up|you suck|nobody likes you|kill yourself|kys)\M'
      OR coalesce(_t,'') ~ '(غبي|غبية|حمار|فاشل|فاشلة|تافه|تافهة|قبيح|قبيحة|اخرس|أخرس|حقير|حقيرة)'
$$;

CREATE OR REPLACE FUNCTION public.reject_hurtful_language() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_hurtful_text(NEW.body) THEN
    RAISE EXCEPTION 'HURTFUL_LANGUAGE' USING HINT = 'Please keep comments kind and respectful.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reject_hurtful_comments ON public.post_comments;
CREATE TRIGGER reject_hurtful_comments BEFORE INSERT OR UPDATE OF body ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.reject_hurtful_language();
DROP TRIGGER IF EXISTS reject_hurtful_posts ON public.posts;
CREATE TRIGGER reject_hurtful_posts BEFORE INSERT OR UPDATE OF body ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.reject_hurtful_language();