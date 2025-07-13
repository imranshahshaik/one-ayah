export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ayahs: {
        Row: {
          ayah_number: number
          created_at: string | null
          id: number
          juz_number: number | null
          page_number: number | null
          surah_number: number
          text_arabic: string
          text_english: string | null
          text_transliteration: string | null
        }
        Insert: {
          ayah_number: number
          created_at?: string | null
          id?: number
          juz_number?: number | null
          page_number?: number | null
          surah_number: number
          text_arabic: string
          text_english?: string | null
          text_transliteration?: string | null
        }
        Update: {
          ayah_number?: number
          created_at?: string | null
          id?: number
          juz_number?: number | null
          page_number?: number | null
          surah_number?: number
          text_arabic?: string
          text_english?: string | null
          text_transliteration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ayahs_surah_number_fkey"
            columns: ["surah_number"]
            isOneToOne: false
            referencedRelation: "surahs"
            referencedColumns: ["number"]
          },
        ]
      }
      daily_sessions: {
        Row: {
          ayahs_memorized: number | null
          ayahs_reviewed: number | null
          created_at: string | null
          id: string
          session_date: string | null
          streak_day: number | null
          total_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ayahs_memorized?: number | null
          ayahs_reviewed?: number | null
          created_at?: string | null
          id?: string
          session_date?: string | null
          streak_day?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ayahs_memorized?: number | null
          ayahs_reviewed?: number | null
          created_at?: string | null
          id?: string
          session_date?: string | null
          streak_day?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memorized_ayahs: {
        Row: {
          ayah_number: number
          created_at: string | null
          ease_factor: number | null
          id: string
          interval_days: number | null
          last_reviewed_at: string | null
          memorized_at: string | null
          next_review_date: string | null
          page_number: number
          review_count: number | null
          review_quality: string | null
          surah_number: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ayah_number: number
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          memorized_at?: string | null
          next_review_date?: string | null
          page_number: number
          review_count?: number | null
          review_quality?: string | null
          surah_number: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ayah_number?: number
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          memorized_at?: string | null
          next_review_date?: string | null
          page_number?: number
          review_count?: number | null
          review_quality?: string | null
          surah_number?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorized_ayahs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_completions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          page_number: number
          total_ayahs: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          page_number: number
          total_ayahs: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          page_number?: number
          total_ayahs?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      surahs: {
        Row: {
          created_at: string | null
          english_name: string
          english_name_translation: string
          id: number
          name: string
          number: number
          number_of_ayahs: number
          revelation_type: string
        }
        Insert: {
          created_at?: string | null
          english_name: string
          english_name_translation: string
          id?: number
          name: string
          number: number
          number_of_ayahs: number
          revelation_type: string
        }
        Update: {
          created_at?: string | null
          english_name?: string
          english_name_translation?: string
          id?: number
          name?: string
          number?: number
          number_of_ayahs?: number
          revelation_type?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          ayahs_due_review: number | null
          best_streak: number | null
          created_at: string | null
          current_page: number | null
          current_streak: number | null
          id: string
          last_memorized_date: string | null
          last_visited_ayah: number | null
          last_visited_surah: number | null
          memorized_ayahs: Json | null
          pages_completed: number | null
          total_memorized: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ayahs_due_review?: number | null
          best_streak?: number | null
          created_at?: string | null
          current_page?: number | null
          current_streak?: number | null
          id?: string
          last_memorized_date?: string | null
          last_visited_ayah?: number | null
          last_visited_surah?: number | null
          memorized_ayahs?: Json | null
          pages_completed?: number | null
          total_memorized?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ayahs_due_review?: number | null
          best_streak?: number | null
          created_at?: string | null
          current_page?: number | null
          current_streak?: number | null
          id?: string
          last_memorized_date?: string | null
          last_visited_ayah?: number | null
          last_visited_surah?: number | null
          memorized_ayahs?: Json | null
          pages_completed?: number | null
          total_memorized?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_play: boolean | null
          created_at: string | null
          dark_mode: boolean | null
          font_size: string | null
          id: string
          notification_time: string | null
          notifications_enabled: boolean | null
          playback_count: number | null
          translation_on: boolean | null
          transliteration_on: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_play?: boolean | null
          created_at?: string | null
          dark_mode?: boolean | null
          font_size?: string | null
          id?: string
          notification_time?: string | null
          notifications_enabled?: boolean | null
          playback_count?: number | null
          translation_on?: boolean | null
          transliteration_on?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_play?: boolean | null
          created_at?: string | null
          dark_mode?: boolean | null
          font_size?: string | null
          id?: string
          notification_time?: string | null
          notifications_enabled?: boolean | null
          playback_count?: number | null
          translation_on?: boolean | null
          transliteration_on?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_sm2_interval: {
        Args: {
          current_ease_factor: number
          current_interval: number
          quality: string
        }
        Returns: {
          new_ease_factor: number
          new_interval: number
        }[]
      }
      check_page_completion: {
        Args: { user_uuid: string; page_num: number }
        Returns: boolean
      }
      get_due_reviews: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          surah_number: number
          ayah_number: number
          page_number: number
          days_overdue: number
        }[]
      }
      update_ayah_review: {
        Args: { ayah_id: string; quality: string }
        Returns: undefined
      }
      update_user_streak: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
