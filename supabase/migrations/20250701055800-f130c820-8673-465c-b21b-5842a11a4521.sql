
-- Add spaced repetition fields to memorized_ayahs table (some may already exist)
ALTER TABLE public.memorized_ayahs 
ADD COLUMN IF NOT EXISTS ease_factor DOUBLE PRECISION DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_review_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
ADD COLUMN IF NOT EXISTS review_quality TEXT,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create index for efficient review queries
CREATE INDEX IF NOT EXISTS idx_memorized_ayahs_next_review 
ON public.memorized_ayahs(user_id, next_review_date);

-- Create index for page-based queries (for stitched review)
CREATE INDEX IF NOT EXISTS idx_memorized_ayahs_page 
ON public.memorized_ayahs(user_id, page_number, memorized_at);

-- Update daily_sessions table to track more detailed statistics
ALTER TABLE public.daily_sessions 
ADD COLUMN IF NOT EXISTS ayahs_reviewed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER DEFAULT 0;

-- Enable RLS on all tables if not already enabled
ALTER TABLE public.memorized_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for memorized_ayahs
DROP POLICY IF EXISTS "Users can view their own memorized ayahs" ON public.memorized_ayahs;
CREATE POLICY "Users can view their own memorized ayahs" 
ON public.memorized_ayahs FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own memorized ayahs" ON public.memorized_ayahs;
CREATE POLICY "Users can insert their own memorized ayahs" 
ON public.memorized_ayahs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own memorized ayahs" ON public.memorized_ayahs;
CREATE POLICY "Users can update their own memorized ayahs" 
ON public.memorized_ayahs FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for daily_sessions
DROP POLICY IF EXISTS "Users can view their own daily sessions" ON public.daily_sessions;
CREATE POLICY "Users can view their own daily sessions" 
ON public.daily_sessions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily sessions" ON public.daily_sessions;
CREATE POLICY "Users can insert their own daily sessions" 
ON public.daily_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily sessions" ON public.daily_sessions;
CREATE POLICY "Users can update their own daily sessions" 
ON public.daily_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);
