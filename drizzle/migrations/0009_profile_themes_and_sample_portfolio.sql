ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS headline text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'classic', ADD COLUMN IF NOT EXISTS sample_portfolio boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_theme_valid CHECK (theme IN ('classic','garden','coral'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_about_length CHECK (char_length(about) <= 1000);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_headline_length CHECK (char_length(headline) <= 120);