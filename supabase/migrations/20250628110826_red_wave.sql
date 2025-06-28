/*
  # Complete OneAyah Memorization System Schema

  1. New Tables
    - `memorized_ayahs` - Track individual ayah memorization with spaced repetition
    - `user_settings` - Store user preferences and settings
    - `page_completions` - Track completed Mushaf pages
    - `daily_sessions` - Track daily memorization sessions

  2. Enhanced Tables
    - Update existing `user_progress` table with new fields

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user data access
*/

-- Create memorized_ayahs table for spaced repetition system
CREATE TABLE IF NOT EXISTS public.memorized_ayahs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  memorized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  next_review_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 day',
  review_quality TEXT CHECK (review_quality IN ('easy', 'good', 'hard')),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, surah_number, ayah_number)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  playback_count INTEGER DEFAULT 5,
  dark_mode BOOLEAN DEFAULT false,
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra-large')),
  translation_on BOOLEAN DEFAULT true,
  transliteration_on BOOLEAN DEFAULT true,
  auto_play BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '08:00:00',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page_completions table
CREATE TABLE IF NOT EXISTS public.page_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_ayahs INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_number)
);

-- Create daily_sessions table
CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_date DATE DEFAULT CURRENT_DATE,
  ayahs_memorized INTEGER DEFAULT 0,
  ayahs_reviewed INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  streak_day INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- Add new columns to existing user_progress table
DO $$
BEGIN
  -- Add page tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'current_page'
  ) THEN
    ALTER TABLE public.user_progress ADD COLUMN current_page INTEGER DEFAULT 1;
  END IF;

  -- Add review tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'ayahs_due_review'
  ) THEN
    ALTER TABLE public.user_progress ADD COLUMN ayahs_due_review INTEGER DEFAULT 0;
  END IF;

  -- Add pages completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'pages_completed'
  ) THEN
    ALTER TABLE public.user_progress ADD COLUMN pages_completed INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.memorized_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for memorized_ayahs
CREATE POLICY "Users can view own memorized ayahs" 
  ON public.memorized_ayahs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memorized ayahs" 
  ON public.memorized_ayahs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memorized ayahs" 
  ON public.memorized_ayahs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" 
  ON public.user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
  ON public.user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
  ON public.user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for page_completions
CREATE POLICY "Users can view own page completions" 
  ON public.page_completions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page completions" 
  ON public.page_completions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for daily_sessions
CREATE POLICY "Users can view own daily sessions" 
  ON public.daily_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily sessions" 
  ON public.daily_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily sessions" 
  ON public.daily_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to calculate spaced repetition interval using SM-2 algorithm
CREATE OR REPLACE FUNCTION public.calculate_sm2_interval(
  current_ease_factor FLOAT,
  current_interval INTEGER,
  quality TEXT
)
RETURNS TABLE(new_ease_factor FLOAT, new_interval INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  q INTEGER;
  ef FLOAT := current_ease_factor;
  interval_days INTEGER := current_interval;
BEGIN
  -- Convert quality to numeric value
  CASE quality
    WHEN 'hard' THEN q := 1;
    WHEN 'good' THEN q := 3;
    WHEN 'easy' THEN q := 5;
    ELSE q := 3; -- default to good
  END CASE;

  -- SM-2 Algorithm
  IF q >= 3 THEN
    -- Correct response
    IF interval_days = 1 THEN
      interval_days := 6;
    ELSIF interval_days = 6 THEN
      interval_days := 6;
    ELSE
      interval_days := ROUND(interval_days * ef);
    END IF;
  ELSE
    -- Incorrect response - reset interval
    interval_days := 1;
  END IF;

  -- Update ease factor
  ef := ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  -- Ensure ease factor doesn't go below 1.3
  IF ef < 1.3 THEN
    ef := 1.3;
  END IF;

  RETURN QUERY SELECT ef, interval_days;
END;
$$;

-- Function to update ayah review with spaced repetition
CREATE OR REPLACE FUNCTION public.update_ayah_review(
  ayah_id UUID,
  quality TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_ease FLOAT;
  current_interval INTEGER;
  new_ease FLOAT;
  new_interval INTEGER;
BEGIN
  -- Get current values
  SELECT ease_factor, interval_days 
  INTO current_ease, current_interval
  FROM public.memorized_ayahs 
  WHERE id = ayah_id;

  -- Calculate new values using SM-2
  SELECT * INTO new_ease, new_interval
  FROM public.calculate_sm2_interval(current_ease, current_interval, quality);

  -- Update the ayah record
  UPDATE public.memorized_ayahs 
  SET 
    ease_factor = new_ease,
    interval_days = new_interval,
    next_review_date = CURRENT_DATE + (new_interval || ' days')::INTERVAL,
    last_reviewed_at = NOW(),
    review_quality = quality,
    review_count = review_count + 1,
    updated_at = NOW()
  WHERE id = ayah_id;
END;
$$;

-- Function to get ayahs due for review
CREATE OR REPLACE FUNCTION public.get_due_reviews(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  surah_number INTEGER,
  ayah_number INTEGER,
  page_number INTEGER,
  days_overdue INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id,
    ma.surah_number,
    ma.ayah_number,
    ma.page_number,
    (CURRENT_DATE - ma.next_review_date)::INTEGER as days_overdue
  FROM public.memorized_ayahs ma
  WHERE ma.user_id = user_uuid 
    AND ma.next_review_date <= CURRENT_DATE
  ORDER BY ma.next_review_date ASC, ma.memorized_at ASC;
END;
$$;

-- Function to check and mark page completion
CREATE OR REPLACE FUNCTION public.check_page_completion(
  user_uuid UUID,
  page_num INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  total_ayahs_on_page INTEGER;
  memorized_ayahs_on_page INTEGER;
  is_completed BOOLEAN := FALSE;
BEGIN
  -- This would need to be populated with actual Mushaf page data
  -- For now, we'll use a simple calculation
  -- In production, you'd have a pages table with ayah mappings
  
  -- Count memorized ayahs on this page
  SELECT COUNT(*)
  INTO memorized_ayahs_on_page
  FROM public.memorized_ayahs
  WHERE user_id = user_uuid AND page_number = page_num;

  -- For demo purposes, assume 15 ayahs per page average
  -- In production, this should come from a pages metadata table
  total_ayahs_on_page := 15;

  -- Check if page is complete
  IF memorized_ayahs_on_page >= total_ayahs_on_page THEN
    -- Mark page as completed
    INSERT INTO public.page_completions (user_id, page_number, total_ayahs)
    VALUES (user_uuid, page_num, total_ayahs_on_page)
    ON CONFLICT (user_id, page_number) DO NOTHING;
    
    is_completed := TRUE;
  END IF;

  RETURN is_completed;
END;
$$;

-- Enhanced user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  );
  
  INSERT INTO public.user_progress (user_id)
  VALUES (new.id);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;