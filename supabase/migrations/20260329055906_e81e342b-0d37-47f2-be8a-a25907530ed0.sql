
-- Create doubts table
CREATE TABLE public.doubts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  whatsapp_number TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own doubts" ON public.doubts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own doubts" ON public.doubts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all doubts" ON public.doubts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create doubt_messages table for chat
CREATE TABLE public.doubt_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT,
  image_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doubt_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of own doubts" ON public.doubt_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.doubts WHERE doubts.id = doubt_messages.doubt_id AND (doubts.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Users can insert messages to own doubts" ON public.doubt_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.doubts WHERE doubts.id = doubt_messages.doubt_id AND (doubts.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Admins can manage all messages" ON public.doubt_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for doubt messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.doubt_messages;

-- Create question_reports table
CREATE TABLE public.question_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  report_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports" ON public.question_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own reports" ON public.question_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reports" ON public.question_reports FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add gender field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Allow all authenticated users to see profiles for leaderboard
CREATE POLICY "Authenticated can view all profiles for leaderboard" ON public.profiles FOR SELECT TO authenticated USING (true);
