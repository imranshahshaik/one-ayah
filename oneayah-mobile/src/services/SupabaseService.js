import { supabase } from '../config/supabase';

class SupabaseService {
  async addMemorizedAyah(surah, ayah, pageNumber) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check if already memorized
      const { data: existing } = await supabase
        .from('memorized_ayahs')
        .select('id')
        .eq('user_id', user.id)
        .eq('surah_number', surah)
        .eq('ayah_number', ayah)
        .single();

      if (existing) {
        console.log('Ayah already memorized');
        return null;
      }

      // Add new memorized ayah
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .insert({
          user_id: user.id,
          surah_number: surah,
          ayah_number: ayah,
          page_number: pageNumber,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user progress
      await this.updateUserProgress({
        last_visited_surah: surah,
        last_visited_ayah: ayah,
        last_memorized_date: new Date().toISOString().split('T')[0],
      });

      return data;
    } catch (error) {
      console.error('Error adding memorized ayah:', error);
      throw error;
    }
  }

  async getMemorizedAyahs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('memorized_ayahs')
        .select('*')
        .eq('user_id', user.id)
        .order('memorized_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching memorized ayahs:', error);
      return [];
    }
  }

  async getUserProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  async updateUserProgress(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  async getDueReviews() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_due_reviews', {
        user_uuid: user.id
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching due reviews:', error);
      return [];
    }
  }

  async updateAyahReview(ayahId, quality) {
    try {
      const { error } = await supabase.rpc('update_ayah_review', {
        ayah_id: ayahId,
        quality: quality
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating ayah review:', error);
      return false;
    }
  }

  async getDailySessions(days = 30) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('session_date', startDate.toISOString().split('T')[0])
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily sessions:', error);
      return [];
    }
  }

  async updateDailySession(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const today = new Date().toISOString().split('T')[0];

      // Get existing session for today
      const { data: existing } = await supabase
        .from('daily_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .single();

      if (existing) {
        // Update existing session
        const { error } = await supabase
          .from('daily_sessions')
          .update({
            ayahs_memorized: (existing.ayahs_memorized || 0) + (updates.ayahs_memorized || 0),
            ayahs_reviewed: (existing.ayahs_reviewed || 0) + (updates.ayahs_reviewed || 0),
            total_time_minutes: (existing.total_time_minutes || 0) + (updates.total_time_minutes || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new session
        const { error } = await supabase
          .from('daily_sessions')
          .insert({
            user_id: user.id,
            session_date: today,
            ayahs_memorized: updates.ayahs_memorized || 0,
            ayahs_reviewed: updates.ayahs_reviewed || 0,
            total_time_minutes: updates.total_time_minutes || 0,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating daily session:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();