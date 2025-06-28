
-- Enable Google OAuth provider and create user profiles table
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  memorized_ayahs JSONB DEFAULT '[]'::jsonb,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_memorized_date DATE,
  last_visited_surah INTEGER DEFAULT 1,
  last_visited_ayah INTEGER DEFAULT 1,
  total_memorized INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_progress
CREATE POLICY "Users can view own progress" 
  ON public.user_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
  ON public.user_progress FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
  ON public.user_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user creation
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
  
  RETURN new;
END;
$$;

-- Trigger to automatically create profile and progress on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update streak when ayah is memorized
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  last_date DATE;
  current_date DATE := CURRENT_DATE;
  current_streak_val INTEGER;
BEGIN
  SELECT last_memorized_date, current_streak 
  INTO last_date, current_streak_val
  FROM public.user_progress 
  WHERE user_id = user_uuid;
  
  IF last_date IS NULL OR last_date < current_date - INTERVAL '1 day' THEN
    -- Reset streak if more than 1 day gap
    IF last_date IS NULL OR last_date < current_date - INTERVAL '1 day' THEN
      current_streak_val := 1;
    ELSE
      current_streak_val := current_streak_val + 1;
    END IF;
  ELSIF last_date = current_date THEN
    -- Same day, don't increment streak
    RETURN;
  ELSE
    -- Consecutive day
    current_streak_val := current_streak_val + 1;
  END IF;
  
  UPDATE public.user_progress 
  SET 
    current_streak = current_streak_val,
    best_streak = GREATEST(best_streak, current_streak_val),
    last_memorized_date = current_date,
    updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$;
