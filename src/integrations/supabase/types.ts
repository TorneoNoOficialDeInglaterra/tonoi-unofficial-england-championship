export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          response: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          response?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          response?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          answer_ca: string | null
          answer_en: string | null
          answer_eu: string | null
          answer_gl: string | null
          answer_it: string | null
          answer_pt: string | null
          created_at: string
          display_order: number
          id: string
          question: string
          question_ca: string | null
          question_en: string | null
          question_eu: string | null
          question_gl: string | null
          question_it: string | null
          question_pt: string | null
          updated_at: string
        }
        Insert: {
          answer: string
          answer_ca?: string | null
          answer_en?: string | null
          answer_eu?: string | null
          answer_gl?: string | null
          answer_it?: string | null
          answer_pt?: string | null
          created_at?: string
          display_order?: number
          id?: string
          question: string
          question_ca?: string | null
          question_en?: string | null
          question_eu?: string | null
          question_gl?: string | null
          question_it?: string | null
          question_pt?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string
          answer_ca?: string | null
          answer_en?: string | null
          answer_eu?: string | null
          answer_gl?: string | null
          answer_it?: string | null
          answer_pt?: string | null
          created_at?: string
          display_order?: number
          id?: string
          question?: string
          question_ca?: string | null
          question_en?: string | null
          question_eu?: string | null
          question_gl?: string | null
          question_it?: string | null
          question_pt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      goalkeeper_stats: {
        Row: {
          clean_sheets: number
          created_at: string
          goalkeeper_name: string
          id: string
          season_id: string
          team_id: string | null
        }
        Insert: {
          clean_sheets?: number
          created_at?: string
          goalkeeper_name: string
          id?: string
          season_id: string
          team_id?: string | null
        }
        Update: {
          clean_sheets?: number
          created_at?: string
          goalkeeper_name?: string
          id?: string
          season_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goalkeeper_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goalkeeper_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      goalkeeper_stats_alltime: {
        Row: {
          clean_sheets: number
          goalkeeper_name: string
          id: string
          updated_at: string
        }
        Insert: {
          clean_sheets?: number
          goalkeeper_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          clean_sheets?: number
          goalkeeper_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      goalkeeper_stats_history: {
        Row: {
          archived_at: string
          clean_sheets: number
          goalkeeper_name: string
          id: string
          season_label: string
          team_id: string | null
        }
        Insert: {
          archived_at?: string
          clean_sheets?: number
          goalkeeper_name: string
          id?: string
          season_label: string
          team_id?: string | null
        }
        Update: {
          archived_at?: string
          clean_sheets?: number
          goalkeeper_name?: string
          id?: string
          season_label?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goalkeeper_stats_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_fixtures: {
        Row: {
          away_api_team_id: number | null
          away_goals: number | null
          away_logo: string | null
          away_name: string
          away_pens: number | null
          away_team_id: string | null
          champion_team_id: string | null
          created_at: string
          elapsed: number | null
          events: Json
          fixture_id: number
          home_api_team_id: number | null
          home_goals: number | null
          home_logo: string | null
          home_name: string
          home_pens: number | null
          home_team_id: string | null
          id: string
          is_current: boolean
          kickoff_at: string
          league_logo: string | null
          league_name: string | null
          round: string | null
          status_long: string | null
          status_short: string
          updated_at: string
        }
        Insert: {
          away_api_team_id?: number | null
          away_goals?: number | null
          away_logo?: string | null
          away_name: string
          away_pens?: number | null
          away_team_id?: string | null
          champion_team_id?: string | null
          created_at?: string
          elapsed?: number | null
          events?: Json
          fixture_id: number
          home_api_team_id?: number | null
          home_goals?: number | null
          home_logo?: string | null
          home_name: string
          home_pens?: number | null
          home_team_id?: string | null
          id?: string
          is_current?: boolean
          kickoff_at: string
          league_logo?: string | null
          league_name?: string | null
          round?: string | null
          status_long?: string | null
          status_short?: string
          updated_at?: string
        }
        Update: {
          away_api_team_id?: number | null
          away_goals?: number | null
          away_logo?: string | null
          away_name?: string
          away_pens?: number | null
          away_team_id?: string | null
          champion_team_id?: string | null
          created_at?: string
          elapsed?: number | null
          events?: Json
          fixture_id?: number
          home_api_team_id?: number | null
          home_goals?: number | null
          home_logo?: string | null
          home_name?: string
          home_pens?: number | null
          home_team_id?: string | null
          id?: string
          is_current?: boolean
          kickoff_at?: string
          league_logo?: string | null
          league_name?: string | null
          round?: string | null
          status_long?: string | null
          status_short?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_fixtures_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      logo_fetch_attempts: {
        Row: {
          attempts: number
          last_attempt_at: string | null
          last_error: string | null
          last_status: string | null
          next_retry_at: string
          team_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          last_attempt_at?: string | null
          last_error?: string | null
          last_status?: string | null
          next_retry_at?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          last_attempt_at?: string | null
          last_error?: string | null
          last_status?: string | null
          next_retry_at?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logo_fetch_attempts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          home_team_id: string | null
          id: string
          loser_goals: number
          loser_pens: number | null
          loser_team_id: string
          match_date: string
          notes: string | null
          title_changed: boolean
          was_draw: boolean
          winner_goals: number
          winner_pens: number | null
          winner_team_id: string
        }
        Insert: {
          created_at?: string
          home_team_id?: string | null
          id?: string
          loser_goals?: number
          loser_pens?: number | null
          loser_team_id: string
          match_date: string
          notes?: string | null
          title_changed?: boolean
          was_draw?: boolean
          winner_goals?: number
          winner_pens?: number | null
          winner_team_id: string
        }
        Update: {
          created_at?: string
          home_team_id?: string | null
          id?: string
          loser_goals?: number
          loser_pens?: number | null
          loser_team_id?: string
          match_date?: string
          notes?: string | null
          title_changed?: boolean
          was_draw?: boolean
          winner_goals?: number
          winner_pens?: number | null
          winner_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_loser_team_id_fkey"
            columns: ["loser_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          assists: number
          created_at: string
          goals: number
          id: string
          player_name: string
          season_id: string
          team_id: string | null
        }
        Insert: {
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          player_name: string
          season_id: string
          team_id?: string | null
        }
        Update: {
          assists?: number
          created_at?: string
          goals?: number
          id?: string
          player_name?: string
          season_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats_alltime: {
        Row: {
          assists: number
          goals: number
          id: string
          player_name: string
          updated_at: string
        }
        Insert: {
          assists?: number
          goals?: number
          id?: string
          player_name: string
          updated_at?: string
        }
        Update: {
          assists?: number
          goals?: number
          id?: string
          player_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_stats_history: {
        Row: {
          archived_at: string
          assists: number
          goals: number
          id: string
          player_name: string
          season_label: string
          team_id: string | null
        }
        Insert: {
          archived_at?: string
          assists?: number
          goals?: number
          id?: string
          player_name: string
          season_label: string
          team_id?: string | null
        }
        Update: {
          archived_at?: string
          assists?: number
          goals?: number
          id?: string
          player_name?: string
          season_label?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          label: string
          started_at: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          label: string
          started_at?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          started_at?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          api_football_team_id: number | null
          country_code: string | null
          created_at: string
          football_data_team_id: number | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          sportsdb_team_id: number | null
        }
        Insert: {
          api_football_team_id?: number | null
          country_code?: string | null
          created_at?: string
          football_data_team_id?: number | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          sportsdb_team_id?: number | null
        }
        Update: {
          api_football_team_id?: number | null
          country_code?: string | null
          created_at?: string
          football_data_team_id?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sportsdb_team_id?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
