
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preparation_goal text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'english';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category text DEFAULT 'course';
