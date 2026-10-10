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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          blocked_answer_attempt: boolean
          created_at: string
          hints: string[]
          id: string
          next_step: string | null
          praise: string | null
          request_text: string | null
          submission_id: string
        }
        Insert: {
          blocked_answer_attempt?: boolean
          created_at?: string
          hints?: string[]
          id?: string
          next_step?: string | null
          praise?: string | null
          request_text?: string | null
          submission_id: string
        }
        Update: {
          blocked_answer_attempt?: boolean
          created_at?: string
          hints?: string[]
          id?: string
          next_step?: string | null
          praise?: string | null
          request_text?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          props: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          props?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          props?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      annotations: {
        Row: {
          artifact_id: string
          author_id: string
          created_at: string
          id: string
          session_id: string | null
          step_ref: number | null
          text: string
          x: number | null
          y: number | null
        }
        Insert: {
          artifact_id: string
          author_id: string
          created_at?: string
          id?: string
          session_id?: string | null
          step_ref?: number | null
          text: string
          x?: number | null
          y?: number | null
        }
        Update: {
          artifact_id?: string
          author_id?: string
          created_at?: string
          id?: string
          session_id?: string | null
          step_ref?: number | null
          text?: string
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "annotations_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          id: string
          public_approved: boolean
          published_at: string
          submission_id: string
          visibility: string
        }
        Insert: {
          id?: string
          public_approved?: boolean
          published_at?: string
          submission_id: string
          visibility?: string
        }
        Update: {
          id?: string
          public_approved?: boolean
          published_at?: string
          submission_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_awards: {
        Row: {
          artifact_id: string | null
          badge_id: string
          created_at: string
          id: string
          note: string | null
          student_id: string
          teacher_id: string
        }
        Insert: {
          artifact_id?: string | null
          badge_id: string
          created_at?: string
          id?: string
          note?: string | null
          student_id: string
          teacher_id: string
        }
        Update: {
          artifact_id?: string | null
          badge_id?: string
          created_at?: string
          id?: string
          note?: string | null
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_awards_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_awards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "competency_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_answers: {
        Row: {
          challenge_id: string
          final_answer: string
        }
        Insert: {
          challenge_id: string
          final_answer: string
        }
        Update: {
          challenge_id?: string
          final_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_answers_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: true
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          class_id: string
          concept_tokens: string[]
          created_at: string
          id: string
          prompt_image: string | null
          prompt_text: string
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          concept_tokens?: string[]
          created_at?: string
          id?: string
          prompt_image?: string | null
          prompt_text: string
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string
          concept_tokens?: string[]
          created_at?: string
          id?: string
          prompt_image?: string | null
          prompt_text?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          allow_school: boolean
          anonymous_mode: boolean
          created_at: string
          id: string
          join_code: string
          name: string
          teacher_id: string
        }
        Insert: {
          allow_school?: boolean
          anonymous_mode?: boolean
          created_at?: string
          id?: string
          join_code?: string
          name: string
          teacher_id: string
        }
        Update: {
          allow_school?: boolean
          anonymous_mode?: boolean
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      cognitive_attempts: {
        Row: {
          created_at: string
          goal: string
          id: string
          questionnaire_version: string
          responses: Json
          scoring_version: string
          status: string
          student_id: string
          submitted_at: string | null
          updated_at: string
          use_for_coach: boolean
        }
        Insert: {
          created_at?: string
          goal?: string
          id?: string
          questionnaire_version?: string
          responses?: Json
          scoring_version?: string
          status?: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string
          use_for_coach?: boolean
        }
        Update: {
          created_at?: string
          goal?: string
          id?: string
          questionnaire_version?: string
          responses?: Json
          scoring_version?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
          use_for_coach?: boolean
        }
        Relationships: []
      }
      competency_badges: {
        Row: {
          description: string
          icon: string
          id: string
          linked_skill: string
          name: string
        }
        Insert: {
          description: string
          icon: string
          id?: string
          linked_skill: string
          name: string
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          linked_skill?: string
          name?: string
        }
        Relationships: []
      }
      flags: {
        Row: {
          created_at: string
          id: string
          note: string | null
          source: string
          submission_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          source?: string
          submission_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          source?: string
          submission_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_tasks: {
        Row: {
          artifact_id: string | null
          assigned_by: string
          created_at: string
          due_at: string | null
          duration_min: number
          id: string
          instructions: string
          status: string
          student_id: string
          title: string
        }
        Insert: {
          artifact_id?: string | null
          assigned_by: string
          created_at?: string
          due_at?: string | null
          duration_min?: number
          id?: string
          instructions: string
          status?: string
          student_id: string
          title: string
        }
        Update: {
          artifact_id?: string | null
          assigned_by?: string
          created_at?: string
          due_at?: string | null
          duration_min?: number
          id?: string
          instructions?: string
          status?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_tasks_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          hidden: boolean
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          hidden?: boolean
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          hidden?: boolean
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          author_subtitle: string | null
          body: string
          created_at: string
          hidden: boolean
          id: string
        }
        Insert: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          author_subtitle?: string | null
          body: string
          created_at?: string
          hidden?: boolean
          id?: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          author_subtitle?: string | null
          body?: string
          created_at?: string
          hidden?: boolean
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_13_plus: boolean
          avatar_url: string | null
          created_at: string
          display_name: string
          grade: number | null
          id: string
          voice_consent: boolean
        }
        Insert: {
          age_13_plus?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          grade?: number | null
          id: string
          voice_consent?: boolean
        }
        Update: {
          age_13_plus?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          grade?: number | null
          id?: string
          voice_consent?: boolean
        }
        Relationships: []
      }
      reactions: {
        Row: {
          artifact_id: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          artifact_id: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          artifact_id?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_note: string | null
          created_at: string
          details: string | null
          handled_by: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_label: string | null
          target_type: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          handled_by?: string | null
          id?: string
          reason: string
          reporter_id?: string
          status?: string
          target_id: string
          target_label?: string | null
          target_type: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          handled_by?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_label?: string | null
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      submission_versions: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          step1_text: string | null
          step2_text: string | null
          step3_text: string | null
          submission_id: string
          version: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          step1_text?: string | null
          step2_text?: string | null
          step3_text?: string | null
          submission_id: string
          version: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          step1_text?: string | null
          step2_text?: string | null
          step3_text?: string | null
          submission_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "submission_versions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          challenge_id: string
          concept_token: string | null
          confidence: number | null
          confidence_initial: number | null
          created_at: string
          id: string
          rubric: Json | null
          started_at: string
          status: string
          step_images: Json
          step1_text: string
          step2_text: string
          step3_text: string
          student_id: string
          updated_at: string
          version: number
          voice_duration_s: number | null
          voice_transcript: string | null
          voice_url: string | null
        }
        Insert: {
          challenge_id: string
          concept_token?: string | null
          confidence?: number | null
          confidence_initial?: number | null
          created_at?: string
          id?: string
          rubric?: Json | null
          started_at?: string
          status?: string
          step_images?: Json
          step1_text?: string
          step2_text?: string
          step3_text?: string
          student_id: string
          updated_at?: string
          version?: number
          voice_duration_s?: number | null
          voice_transcript?: string | null
          voice_url?: string | null
        }
        Update: {
          challenge_id?: string
          concept_token?: string | null
          confidence?: number | null
          confidence_initial?: number | null
          created_at?: string
          id?: string
          rubric?: Json | null
          started_at?: string
          status?: string
          step_images?: Json
          step1_text?: string
          step2_text?: string
          step3_text?: string
          student_id?: string
          updated_at?: string
          version?: number
          voice_duration_s?: number | null
          voice_transcript?: string | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      synthesis_sessions: {
        Row: {
          artifact_ids: string[]
          class_id: string
          code: string
          current_index: number
          ended_at: string | null
          id: string
          misconception_artifact_id: string | null
          prompts: string[]
          revealed_misconception: boolean
          started_at: string
          teacher_id: string
          transfer_minutes: number | null
          transfer_started_at: string | null
          transfer_task: string | null
        }
        Insert: {
          artifact_ids?: string[]
          class_id: string
          code?: string
          current_index?: number
          ended_at?: string | null
          id?: string
          misconception_artifact_id?: string | null
          prompts?: string[]
          revealed_misconception?: boolean
          started_at?: string
          teacher_id: string
          transfer_minutes?: number | null
          transfer_started_at?: string | null
          transfer_task?: string | null
        }
        Update: {
          artifact_ids?: string[]
          class_id?: string
          code?: string
          current_index?: number
          ended_at?: string | null
          id?: string
          misconception_artifact_id?: string | null
          prompts?: string[]
          revealed_misconception?: boolean
          started_at?: string
          teacher_id?: string
          transfer_minutes?: number | null
          transfer_started_at?: string | null
          transfer_task?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "synthesis_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      transfer_responses: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          response: string
          session_id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          response?: string
          session_id: string
          student_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          response?: string
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "synthesis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      artifact_class: { Args: { _artifact_id: string }; Returns: string }
      can_view_artifact: {
        Args: { _artifact_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      challenge_class: { Args: { _challenge_id: string }; Returns: string }
      find_session_by_code: { Args: { _code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_school_sso: { Args: { _user_id: string }; Returns: boolean }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_sso_teacher: { Args: { _user_id: string }; Returns: boolean }
      join_class: { Args: { _code: string }; Returns: string }
      review_teacher_request: {
        Args: { _approve: boolean; _request_id: string }
        Returns: undefined
      }
      search_people: {
        Args: { _term: string }
        Returns: {
          avatar_url: string
          display_name: string
          grade: number
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      submission_class: { Args: { _submission_id: string }; Returns: string }
    }
    Enums: {
      app_role: "student" | "teacher" | "school_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "teacher", "school_admin"],
    },
  },
} as const
