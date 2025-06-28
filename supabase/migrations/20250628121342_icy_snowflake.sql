/*
  # Complete OneAyah Database Schema

  1. New Tables
    - `surahs` - Complete Quran chapter data
    - `ayahs` - Verse data with Arabic, translation, transliteration
    - `memorized_ayahs` - User memorization tracking with SM-2 algorithm
    - `user_progress` - User progress and streak tracking
    - `page_completions` - Page completion tracking
    - `daily_sessions` - Daily activity tracking
    - `user_settings` - User preferences and settings

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Public read access for surahs and ayahs

  3. Functions
    - User creation handler
    - Streak update logic
    - SM-2 review system
    - Page completion checker
*/

-- Create surahs table with complete data
CREATE TABLE IF NOT EXISTS public.surahs (
  id SERIAL PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  english_name_translation TEXT NOT NULL,
  number_of_ayahs INTEGER NOT NULL,
  revelation_type TEXT NOT NULL CHECK (revelation_type IN ('Meccan', 'Medinan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ayahs table
CREATE TABLE IF NOT EXISTS public.ayahs (
  id SERIAL PRIMARY KEY,
  surah_number INTEGER NOT NULL REFERENCES public.surahs(number),
  ayah_number INTEGER NOT NULL,
  text_arabic TEXT NOT NULL,
  text_english TEXT,
  text_transliteration TEXT,
  page_number INTEGER,
  juz_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(surah_number, ayah_number)
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memorized_ayahs JSONB DEFAULT '[]'::jsonb,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_memorized_date DATE,
  last_visited_surah INTEGER DEFAULT 1,
  last_visited_ayah INTEGER DEFAULT 1,
  total_memorized INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_page INTEGER DEFAULT 1,
  ayahs_due_review INTEGER DEFAULT 0,
  pages_completed INTEGER DEFAULT 0
);

-- Create memorized_ayahs table with SM-2 algorithm support
CREATE TABLE IF NOT EXISTS public.memorized_ayahs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  memorized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  ease_factor DOUBLE PRECISION DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  next_review_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 day'),
  review_quality TEXT CHECK (review_quality IN ('easy', 'good', 'hard')),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, surah_number, ayah_number)
);

-- Create page_completions table
CREATE TABLE IF NOT EXISTS public.page_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_ayahs INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, page_number)
);

-- Create daily_sessions table
CREATE TABLE IF NOT EXISTS public.daily_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date DATE DEFAULT CURRENT_DATE,
  ayahs_memorized INTEGER DEFAULT 0,
  ayahs_reviewed INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  streak_day INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE public.surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorized_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read on surahs" ON public.surahs;
DROP POLICY IF EXISTS "Allow public read on ayahs" ON public.ayahs;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can view own memorized ayahs" ON public.memorized_ayahs;
DROP POLICY IF EXISTS "Users can insert own memorized ayahs" ON public.memorized_ayahs;
DROP POLICY IF EXISTS "Users can update own memorized ayahs" ON public.memorized_ayahs;
DROP POLICY IF EXISTS "Users can view own page completions" ON public.page_completions;
DROP POLICY IF EXISTS "Users can insert own page completions" ON public.page_completions;
DROP POLICY IF EXISTS "Users can view own daily sessions" ON public.daily_sessions;
DROP POLICY IF EXISTS "Users can insert own daily sessions" ON public.daily_sessions;
DROP POLICY IF EXISTS "Users can update own daily sessions" ON public.daily_sessions;
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

-- Create policies for public read access to surahs and ayahs
CREATE POLICY "Allow public read on surahs"
  ON public.surahs FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on ayahs"
  ON public.ayahs FOR SELECT
  USING (true);

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for user_progress
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for memorized_ayahs
CREATE POLICY "Users can view own memorized ayahs"
  ON public.memorized_ayahs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memorized ayahs"
  ON public.memorized_ayahs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memorized ayahs"
  ON public.memorized_ayahs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for page_completions
CREATE POLICY "Users can view own page completions"
  ON public.page_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page completions"
  ON public.page_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for daily_sessions
CREATE POLICY "Users can view own daily sessions"
  ON public.daily_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily sessions"
  ON public.daily_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily sessions"
  ON public.daily_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for user_settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert complete surahs data
INSERT INTO public.surahs (number, name, english_name, english_name_translation, number_of_ayahs, revelation_type) VALUES
(1, 'الفاتحة', 'Al-Fatihah', 'The Opening', 7, 'Meccan'),
(2, 'البقرة', 'Al-Baqarah', 'The Cow', 286, 'Medinan'),
(3, 'آل عمران', 'Aal-E-Imran', 'Family of Imran', 200, 'Medinan'),
(4, 'النساء', 'An-Nisa', 'The Women', 176, 'Medinan'),
(5, 'المائدة', 'Al-Maidah', 'The Table Spread', 120, 'Medinan'),
(6, 'الأنعام', 'Al-Anam', 'The Cattle', 165, 'Meccan'),
(7, 'الأعراف', 'Al-Araf', 'The Heights', 206, 'Meccan'),
(8, 'الأنفال', 'Al-Anfal', 'The Spoils of War', 75, 'Medinan'),
(9, 'التوبة', 'At-Tawbah', 'The Repentance', 129, 'Medinan'),
(10, 'يونس', 'Yunus', 'Jonah', 109, 'Meccan'),
(11, 'هود', 'Hud', 'Hud', 123, 'Meccan'),
(12, 'يوسف', 'Yusuf', 'Joseph', 111, 'Meccan'),
(13, 'الرعد', 'Ar-Rad', 'The Thunder', 43, 'Medinan'),
(14, 'ابراهيم', 'Ibrahim', 'Abraham', 52, 'Meccan'),
(15, 'الحجر', 'Al-Hijr', 'The Rocky Tract', 99, 'Meccan'),
(16, 'النحل', 'An-Nahl', 'The Bee', 128, 'Meccan'),
(17, 'الإسراء', 'Al-Isra', 'The Night Journey', 111, 'Meccan'),
(18, 'الكهف', 'Al-Kahf', 'The Cave', 110, 'Meccan'),
(19, 'مريم', 'Maryam', 'Mary', 98, 'Meccan'),
(20, 'طه', 'Taha', 'Ta-Ha', 135, 'Meccan'),
(21, 'الأنبياء', 'Al-Anbya', 'The Prophets', 112, 'Meccan'),
(22, 'الحج', 'Al-Hajj', 'The Pilgrimage', 78, 'Medinan'),
(23, 'المؤمنون', 'Al-Muminun', 'The Believers', 118, 'Meccan'),
(24, 'النور', 'An-Nur', 'The Light', 64, 'Medinan'),
(25, 'الفرقان', 'Al-Furqan', 'The Criterion', 77, 'Meccan'),
(26, 'الشعراء', 'Ash-Shuara', 'The Poets', 227, 'Meccan'),
(27, 'النمل', 'An-Naml', 'The Ant', 93, 'Meccan'),
(28, 'القصص', 'Al-Qasas', 'The Stories', 88, 'Meccan'),
(29, 'العنكبوت', 'Al-Ankabut', 'The Spider', 69, 'Meccan'),
(30, 'الروم', 'Ar-Rum', 'The Romans', 60, 'Meccan'),
(31, 'لقمان', 'Luqman', 'Luqman', 34, 'Meccan'),
(32, 'السجدة', 'As-Sajdah', 'The Prostration', 30, 'Meccan'),
(33, 'الأحزاب', 'Al-Ahzab', 'The Clans', 73, 'Medinan'),
(34, 'سبأ', 'Saba', 'Sheba', 54, 'Meccan'),
(35, 'فاطر', 'Fatir', 'Originator', 45, 'Meccan'),
(36, 'يس', 'Ya-Sin', 'Ya Sin', 83, 'Meccan'),
(37, 'الصافات', 'As-Saffat', 'Those who set the Ranks', 182, 'Meccan'),
(38, 'ص', 'Sad', 'The Letter Sad', 88, 'Meccan'),
(39, 'الزمر', 'Az-Zumar', 'The Troops', 75, 'Meccan'),
(40, 'غافر', 'Ghafir', 'The Forgiver', 85, 'Meccan'),
(41, 'فصلت', 'Fussilat', 'Explained in Detail', 54, 'Meccan'),
(42, 'الشورى', 'Ash-Shuraa', 'The Consultation', 53, 'Meccan'),
(43, 'الزخرف', 'Az-Zukhruf', 'The Ornaments of Gold', 89, 'Meccan'),
(44, 'الدخان', 'Ad-Dukhan', 'The Smoke', 59, 'Meccan'),
(45, 'الجاثية', 'Al-Jathiyah', 'The Crouching', 37, 'Meccan'),
(46, 'الأحقاف', 'Al-Ahqaf', 'The Wind-Curved Sandhills', 35, 'Meccan'),
(47, 'محمد', 'Muhammad', 'Muhammad', 38, 'Medinan'),
(48, 'الفتح', 'Al-Fath', 'The Victory', 29, 'Medinan'),
(49, 'الحجرات', 'Al-Hujurat', 'The Rooms', 18, 'Medinan'),
(50, 'ق', 'Qaf', 'The Letter Qaf', 45, 'Meccan'),
(51, 'الذاريات', 'Adh-Dhariyat', 'The Winnowing Winds', 60, 'Meccan'),
(52, 'الطور', 'At-Tur', 'The Mount', 49, 'Meccan'),
(53, 'النجم', 'An-Najm', 'The Star', 62, 'Meccan'),
(54, 'القمر', 'Al-Qamar', 'The Moon', 55, 'Meccan'),
(55, 'الرحمن', 'Ar-Rahman', 'The Beneficent', 78, 'Medinan'),
(56, 'الواقعة', 'Al-Waqiah', 'The Inevitable', 96, 'Meccan'),
(57, 'الحديد', 'Al-Hadid', 'The Iron', 29, 'Medinan'),
(58, 'المجادلة', 'Al-Mujadila', 'The Pleading Woman', 22, 'Medinan'),
(59, 'الحشر', 'Al-Hashr', 'The Exile', 24, 'Medinan'),
(60, 'الممتحنة', 'Al-Mumtahinah', 'She that is to be examined', 13, 'Medinan'),
(61, 'الصف', 'As-Saff', 'The Ranks', 14, 'Medinan'),
(62, 'الجمعة', 'Al-Jumuah', 'The Congregation', 11, 'Medinan'),
(63, 'المنافقون', 'Al-Munafiqun', 'The Hypocrites', 11, 'Medinan'),
(64, 'التغابن', 'At-Taghabun', 'The Mutual Disillusion', 18, 'Medinan'),
(65, 'الطلاق', 'At-Talaq', 'The Divorce', 12, 'Medinan'),
(66, 'التحريم', 'At-Tahrim', 'The Prohibition', 12, 'Medinan'),
(67, 'الملك', 'Al-Mulk', 'The Sovereignty', 30, 'Meccan'),
(68, 'القلم', 'Al-Qalam', 'The Pen', 52, 'Meccan'),
(69, 'الحاقة', 'Al-Haqqah', 'The Reality', 52, 'Meccan'),
(70, 'المعارج', 'Al-Maarij', 'The Ascending Stairways', 44, 'Meccan'),
(71, 'نوح', 'Nuh', 'Noah', 28, 'Meccan'),
(72, 'الجن', 'Al-Jinn', 'The Jinn', 28, 'Meccan'),
(73, 'المزمل', 'Al-Muzzammil', 'The Enshrouded One', 20, 'Meccan'),
(74, 'المدثر', 'Al-Muddaththir', 'The Cloaked One', 56, 'Meccan'),
(75, 'القيامة', 'Al-Qiyamah', 'The Resurrection', 40, 'Meccan'),
(76, 'الانسان', 'Al-Insan', 'The Human', 31, 'Medinan'),
(77, 'المرسلات', 'Al-Mursalat', 'The Emissaries', 50, 'Meccan'),
(78, 'النبأ', 'An-Naba', 'The Tidings', 40, 'Meccan'),
(79, 'النازعات', 'An-Naziat', 'Those who drag forth', 46, 'Meccan'),
(80, 'عبس', 'Abasa', 'He frowned', 42, 'Meccan'),
(81, 'التكوير', 'At-Takwir', 'The Overthrowing', 29, 'Meccan'),
(82, 'الإنفطار', 'Al-Infitar', 'The Cleaving', 19, 'Meccan'),
(83, 'المطففين', 'Al-Mutaffifin', 'The Defrauding', 36, 'Meccan'),
(84, 'الإنشقاق', 'Al-Inshiqaq', 'The Sundering', 25, 'Meccan'),
(85, 'البروج', 'Al-Buruj', 'The Mansions of the Stars', 22, 'Meccan'),
(86, 'الطارق', 'At-Tariq', 'The Morning Star', 17, 'Meccan'),
(87, 'الأعلى', 'Al-Ala', 'The Most High', 19, 'Meccan'),
(88, 'الغاشية', 'Al-Ghashiyah', 'The Overwhelming', 26, 'Meccan'),
(89, 'الفجر', 'Al-Fajr', 'The Dawn', 30, 'Meccan'),
(90, 'البلد', 'Al-Balad', 'The City', 20, 'Meccan'),
(91, 'الشمس', 'Ash-Shams', 'The Sun', 15, 'Meccan'),
(92, 'الليل', 'Al-Layl', 'The Night', 21, 'Meccan'),
(93, 'الضحى', 'Ad-Duhaa', 'The Morning Hours', 11, 'Meccan'),
(94, 'الشرح', 'Ash-Sharh', 'The Relief', 8, 'Meccan'),
(95, 'التين', 'At-Tin', 'The Fig', 8, 'Meccan'),
(96, 'العلق', 'Al-Alaq', 'The Clot', 19, 'Meccan'),
(97, 'القدر', 'Al-Qadr', 'The Power', 5, 'Meccan'),
(98, 'البينة', 'Al-Bayyinah', 'The Clear Proof', 8, 'Medinan'),
(99, 'الزلزلة', 'Az-Zalzalah', 'The Earthquake', 8, 'Medinan'),
(100, 'العاديات', 'Al-Adiyat', 'The Courser', 11, 'Meccan'),
(101, 'القارعة', 'Al-Qariah', 'The Calamity', 11, 'Meccan'),
(102, 'التكاثر', 'At-Takathur', 'The Rivalry in world increase', 8, 'Meccan'),
(103, 'العصر', 'Al-Asr', 'The Declining Day', 3, 'Meccan'),
(104, 'الهمزة', 'Al-Humazah', 'The Traducer', 9, 'Meccan'),
(105, 'الفيل', 'Al-Fil', 'The Elephant', 5, 'Meccan'),
(106, 'قريش', 'Quraysh', 'Quraysh', 4, 'Meccan'),
(107, 'الماعون', 'Al-Maun', 'The Small kindnesses', 7, 'Meccan'),
(108, 'الكوثر', 'Al-Kawthar', 'The Abundance', 3, 'Meccan'),
(109, 'الكافرون', 'Al-Kafirun', 'The Disbelievers', 6, 'Meccan'),
(110, 'النصر', 'An-Nasr', 'The Divine Support', 3, 'Medinan'),
(111, 'المسد', 'Al-Masad', 'The Palm Fibre', 5, 'Meccan'),
(112, 'الإخلاص', 'Al-Ikhlas', 'The Sincerity', 4, 'Meccan'),
(113, 'الفلق', 'Al-Falaq', 'The Dawn', 5, 'Meccan'),
(114, 'الناس', 'An-Nas', 'The Mankind', 6, 'Meccan')
ON CONFLICT (number) DO NOTHING;

-- Insert sample ayahs for testing (first few ayahs of Al-Fatihah)
INSERT INTO public.ayahs (surah_number, ayah_number, text_arabic, text_english, text_transliteration, page_number, juz_number) VALUES
(1, 1, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', 'Bismillahi r-rahmani r-raheem', 1, 1),
(1, 2, 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'All praise is due to Allah, Lord of the worlds.', 'Alhamdu lillahi rabbi l-alameen', 1, 1),
(1, 3, 'الرَّحْمَٰنِ الرَّحِيمِ', 'The Entirely Merciful, the Especially Merciful,', 'Ar-rahmani r-raheem', 1, 1),
(1, 4, 'مَالِكِ يَوْمِ الدِّينِ', 'Sovereign of the Day of Recompense.', 'Maliki yawmi d-deen', 1, 1),
(1, 5, 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'It is You we worship and You we ask for help.', 'Iyyaka nabudu wa iyyaka nastaeen', 1, 1),
(1, 6, 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Guide us to the straight path', 'Ihdina s-sirata l-mustaqeem', 1, 1),
(1, 7, 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'The path of those upon whom You have bestowed favor, not of those who have evoked Your anger or of those who are astray.', 'Sirata l-ladhina anamta alayhim ghayri l-maghdubi alayhim wa la d-dalleen', 1, 1)
ON CONFLICT (surah_number, ayah_number) DO NOTHING;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  
  -- Insert into user_progress table
  INSERT INTO public.user_progress (user_id, last_visited_surah, last_visited_ayah)
  VALUES (new.id, 1, 1);
  
  -- Insert default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_streak_val INTEGER;
  best_streak_val INTEGER;
  last_memorized DATE;
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Get current progress
  SELECT current_streak, best_streak INTO current_streak_val, best_streak_val
  FROM public.user_progress 
  WHERE user_id = user_uuid;
  
  -- Get last memorized date
  SELECT DATE(memorized_at) INTO last_memorized
  FROM public.memorized_ayahs 
  WHERE user_id = user_uuid 
  ORDER BY memorized_at DESC 
  LIMIT 1;
  
  -- Update streak logic
  IF last_memorized IS NULL OR last_memorized < today_date THEN
    -- First time or new day
    current_streak_val := 1;
  ELSIF last_memorized = today_date THEN
    -- Same day, don't increment
    RETURN;
  ELSE
    -- This shouldn't happen, but handle gracefully
    current_streak_val := current_streak_val + 1;
  END IF;
  
  -- Update best streak if current is better
  IF current_streak_val > best_streak_val THEN
    best_streak_val := current_streak_val;
  END IF;
  
  -- Update user progress
  UPDATE public.user_progress 
  SET 
    current_streak = current_streak_val,
    best_streak = best_streak_val,
    last_memorized_date = today_date,
    updated_at = NOW()
  WHERE user_id = user_uuid;
END;
$$;

-- Function to get due reviews using SM-2 algorithm
CREATE OR REPLACE FUNCTION public.get_due_reviews(user_uuid UUID)
RETURNS TABLE (
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
    GREATEST(0, CURRENT_DATE - ma.next_review_date) as days_overdue
  FROM public.memorized_ayahs ma
  WHERE ma.user_id = user_uuid
    AND ma.next_review_date <= CURRENT_DATE
  ORDER BY ma.next_review_date ASC, ma.memorized_at ASC;
END;
$$;

-- Function to update ayah review with SM-2 algorithm
CREATE OR REPLACE FUNCTION public.update_ayah_review(
  ayah_id UUID,
  quality TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_ease DOUBLE PRECISION;
  current_interval INTEGER;
  new_ease DOUBLE PRECISION;
  new_interval INTEGER;
  q INTEGER;
BEGIN
  -- Get current values
  SELECT ease_factor, interval_days INTO current_ease, current_interval
  FROM public.memorized_ayahs
  WHERE id = ayah_id;
  
  -- Convert quality to numeric value
  CASE quality
    WHEN 'hard' THEN q := 1;
    WHEN 'good' THEN q := 3;
    WHEN 'easy' THEN q := 5;
    ELSE q := 3;
  END CASE;
  
  -- SM-2 Algorithm
  IF q >= 3 THEN
    -- Correct response
    IF current_interval = 1 THEN
      new_interval := 6;
    ELSIF current_interval = 6 THEN
      new_interval := 6;
    ELSE
      new_interval := ROUND(current_interval * current_ease);
    END IF;
  ELSE
    -- Incorrect response - reset interval
    new_interval := 1;
  END IF;
  
  -- Update ease factor
  new_ease := current_ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  -- Ensure ease factor doesn't go below 1.3
  IF new_ease < 1.3 THEN
    new_ease := 1.3;
  END IF;
  
  -- Update the ayah
  UPDATE public.memorized_ayahs
  SET 
    last_reviewed_at = NOW(),
    ease_factor = new_ease,
    interval_days = new_interval,
    next_review_date = CURRENT_DATE + (new_interval || ' days')::INTERVAL,
    review_quality = quality,
    review_count = review_count + 1,
    updated_at = NOW()
  WHERE id = ayah_id;
END;
$$;

-- Function to check page completion
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
  is_complete BOOLEAN := false;
BEGIN
  -- Count total ayahs on the page
  SELECT COUNT(*) INTO total_ayahs_on_page
  FROM public.ayahs
  WHERE page_number = page_num;
  
  -- Count memorized ayahs on the page
  SELECT COUNT(*) INTO memorized_ayahs_on_page
  FROM public.memorized_ayahs
  WHERE user_id = user_uuid AND page_number = page_num;
  
  -- Check if page is complete
  IF total_ayahs_on_page > 0 AND memorized_ayahs_on_page >= total_ayahs_on_page THEN
    is_complete := true;
    
    -- Insert page completion record
    INSERT INTO public.page_completions (user_id, page_number, total_ayahs)
    VALUES (user_uuid, page_num, total_ayahs_on_page)
    ON CONFLICT (user_id, page_number) DO NOTHING;
  END IF;
  
  RETURN is_complete;
END;
$$;