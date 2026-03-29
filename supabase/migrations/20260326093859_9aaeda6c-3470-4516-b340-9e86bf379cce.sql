
-- Fix: Create trigger for handle_new_user (was missing)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add negative_marking and timer settings to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS negative_marking numeric DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS time_per_question integer DEFAULT 60;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS total_views integer DEFAULT 0;

-- Add view counts to topics  
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Add view counts to questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Create app_settings table for admin settings (banners, etc.)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
