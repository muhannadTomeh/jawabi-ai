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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string | null
          admin_user_id: string
          created_at: string
          details: Json
          id: string
          ip_address: string | null
          target_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_user_id: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_user_id?: string
          created_at?: string
          details?: Json
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      api_provider_models: {
        Row: {
          display_name: string
          fetched_at: string
          id: string
          model_id: string
          provider_id: string
        }
        Insert: {
          display_name: string
          fetched_at?: string
          id?: string
          model_id: string
          provider_id: string
        }
        Update: {
          display_name?: string
          fetched_at?: string
          id?: string
          model_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_provider_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      api_providers: {
        Row: {
          api_key: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          last_models_sync_at: string | null
          last_validated_at: string | null
          provider_key: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          last_models_sync_at?: string | null
          last_validated_at?: string | null
          provider_key: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          last_models_sync_at?: string | null
          last_validated_at?: string | null
          provider_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          bot_status: string
          chatbot_id: string
          config: Json | null
          created_at: string
          id: string
          is_connected: boolean
          platform: string
        }
        Insert: {
          bot_status?: string
          chatbot_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_connected?: boolean
          platform: string
        }
        Update: {
          bot_status?: string
          chatbot_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_connected?: boolean
          platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          bot_mode: string
          business_category: string | null
          business_description: string | null
          business_location: string | null
          business_name: string | null
          created_at: string
          custom_instructions: string
          daily_message_limit: number
          dialect: string
          fallback_message: string
          id: string
          is_active: boolean
          language: string
          name: string
          onboarding_completed: boolean
          onboarding_step: number
          owner_telegram_chat_id: string | null
          plan_id: string | null
          public_slug: string | null
          tone: string
          updated_at: string
          user_id: string
          welcome_message: string
        }
        Insert: {
          bot_mode?: string
          business_category?: string | null
          business_description?: string | null
          business_location?: string | null
          business_name?: string | null
          created_at?: string
          custom_instructions?: string
          daily_message_limit?: number
          dialect?: string
          fallback_message?: string
          id?: string
          is_active?: boolean
          language?: string
          name: string
          onboarding_completed?: boolean
          onboarding_step?: number
          owner_telegram_chat_id?: string | null
          plan_id?: string | null
          public_slug?: string | null
          tone?: string
          updated_at?: string
          user_id: string
          welcome_message?: string
        }
        Update: {
          bot_mode?: string
          business_category?: string | null
          business_description?: string | null
          business_location?: string | null
          business_name?: string | null
          created_at?: string
          custom_instructions?: string
          daily_message_limit?: number
          dialect?: string
          fallback_message?: string
          id?: string
          is_active?: boolean
          language?: string
          name?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          owner_telegram_chat_id?: string | null
          plan_id?: string | null
          public_slug?: string | null
          tone?: string
          updated_at?: string
          user_id?: string
          welcome_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_locks: {
        Row: {
          chatbot_id: string
          external_id: string
          locked_at: string
        }
        Insert: {
          chatbot_id: string
          external_id: string
          locked_at?: string
        }
        Update: {
          chatbot_id?: string
          external_id?: string
          locked_at?: string
        }
        Relationships: []
      }
      conversation_takeovers: {
        Row: {
          active: boolean
          channel: string
          chatbot_id: string
          created_at: string
          external_id: string
          id: string
          last_human_at: string
          source: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          channel: string
          chatbot_id: string
          created_at?: string
          external_id: string
          id?: string
          last_human_at?: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          channel?: string
          chatbot_id?: string
          created_at?: string
          external_id?: string
          id?: string
          last_human_at?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_takeovers_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          channel: string
          chatbot_id: string
          created_at: string
          external_id: string
          first_seen_at: string
          id: string
          last_message: string | null
          last_seen_at: string
          message_count: number
          name: string | null
          notes: string | null
          phone: string | null
          tag: Database["public"]["Enums"]["customer_tag"]
          updated_at: string
          username: string | null
        }
        Insert: {
          channel: string
          chatbot_id: string
          created_at?: string
          external_id: string
          first_seen_at?: string
          id?: string
          last_message?: string | null
          last_seen_at?: string
          message_count?: number
          name?: string | null
          notes?: string | null
          phone?: string | null
          tag?: Database["public"]["Enums"]["customer_tag"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          channel?: string
          chatbot_id?: string
          created_at?: string
          external_id?: string
          first_seen_at?: string
          id?: string
          last_message?: string | null
          last_seen_at?: string
          message_count?: number
          name?: string | null
          notes?: string | null
          phone?: string | null
          tag?: Database["public"]["Enums"]["customer_tag"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      handover_settings: {
        Row: {
          chatbot_id: string
          created_at: string
          enabled: boolean
          failed_responses_threshold: number
          handover_message: string
          id: string
          low_confidence_threshold: number
          sale_message: string
          takeover_mode_enabled: boolean
          takeover_timeout_minutes: number
          trigger_keywords: string[]
          trigger_on_sale: boolean
          updated_at: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          enabled?: boolean
          failed_responses_threshold?: number
          handover_message?: string
          id?: string
          low_confidence_threshold?: number
          sale_message?: string
          takeover_mode_enabled?: boolean
          takeover_timeout_minutes?: number
          trigger_keywords?: string[]
          trigger_on_sale?: boolean
          updated_at?: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          enabled?: boolean
          failed_responses_threshold?: number
          handover_message?: string
          id?: string
          low_confidence_threshold?: number
          sale_message?: string
          takeover_mode_enabled?: boolean
          takeover_timeout_minutes?: number
          trigger_keywords?: string[]
          trigger_on_sale?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_settings_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: true
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          answer: string | null
          auto_sync: boolean
          chatbot_id: string
          content: string | null
          created_at: string
          embedding: string | null
          file_name: string | null
          file_url: string | null
          id: string
          last_synced_at: string | null
          question: string | null
          source_ref: string | null
          title: string
          type: string
        }
        Insert: {
          answer?: string | null
          auto_sync?: boolean
          chatbot_id: string
          content?: string | null
          created_at?: string
          embedding?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          last_synced_at?: string | null
          question?: string | null
          source_ref?: string | null
          title: string
          type: string
        }
        Update: {
          answer?: string | null
          auto_sync?: boolean
          chatbot_id?: string
          content?: string | null
          created_at?: string
          embedding?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          last_synced_at?: string | null
          question?: string | null
          source_ref?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_settings: {
        Row: {
          custom_api_key: string | null
          id: string
          model: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          custom_api_key?: string | null
          id?: string
          model?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          custom_api_key?: string | null
          id?: string
          model?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      messenger_messages: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          id: string
          messenger_user_id: string
          role: string
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          id?: string
          messenger_user_id: string
          role: string
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          id?: string
          messenger_user_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_messages_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_users: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          messenger_user_id: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          messenger_user_id: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          messenger_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_users_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          chatbot_id: string
          contact_identifier: string
          contact_name: string | null
          created_at: string
          id: string
          is_read: boolean
          is_resolved: boolean
          last_message: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          channel: string
          chatbot_id: string
          contact_identifier: string
          contact_name?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          last_message?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          channel?: string
          chatbot_id?: string
          contact_identifier?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          is_resolved?: boolean
          last_message?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_sale_orders: {
        Row: {
          channel: string
          chatbot_id: string
          created_at: string
          customer_external_id: string
          customer_name: string | null
          id: string
          owner_chat_id: string
          owner_message_id: number | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          channel: string
          chatbot_id: string
          created_at?: string
          customer_external_id: string
          customer_name?: string | null
          id?: string
          owner_chat_id: string
          owner_message_id?: number | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          chatbot_id?: string
          created_at?: string
          customer_external_id?: string
          customer_name?: string | null
          id?: string
          owner_chat_id?: string
          owner_message_id?: number | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_sale_orders_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          allowed_model: string | null
          created_at: string
          id: string
          is_default: boolean
          max_channels: number
          max_knowledge_items: number | null
          messages_per_day: number
          messages_per_minute_per_chatbot: number
          name: string
          price_monthly: number
          slug: string
          updated_at: string
        }
        Insert: {
          allowed_model?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          max_channels?: number
          max_knowledge_items?: number | null
          messages_per_day?: number
          messages_per_minute_per_chatbot?: number
          name: string
          price_monthly?: number
          slug: string
          updated_at?: string
        }
        Update: {
          allowed_model?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          max_channels?: number
          max_knowledge_items?: number | null
          messages_per_day?: number
          messages_per_minute_per_chatbot?: number
          name?: string
          price_monthly?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          language_preference: string
          notification_preferences: Json
          theme_preference: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language_preference?: string
          notification_preferences?: Json
          theme_preference?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language_preference?: string
          notification_preferences?: Json
          theme_preference?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      rate_limit_counters: {
        Row: {
          bucket_key: string
          created_at: string
          id: string
          request_count: number
          window_start: string
        }
        Insert: {
          bucket_key: string
          created_at?: string
          id?: string
          request_count?: number
          window_start: string
        }
        Update: {
          bucket_key?: string
          created_at?: string
          id?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      rate_limit_violations: {
        Row: {
          bucket_key: string
          channel: string | null
          chatbot_id: string | null
          created_at: string
          id: string
          identifier: string | null
          limit_type: string
        }
        Insert: {
          bucket_key: string
          channel?: string | null
          chatbot_id?: string | null
          created_at?: string
          id?: string
          identifier?: string | null
          limit_type: string
        }
        Update: {
          bucket_key?: string
          channel?: string | null
          chatbot_id?: string | null
          created_at?: string
          id?: string
          identifier?: string | null
          limit_type?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token: string
          bot_status: string
          chatbot_id: string
          created_at: string
          id: string
          metadata: Json | null
          page_id: string
          page_name: string | null
          platform: string
          token_expiry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          bot_status?: string
          chatbot_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          page_id: string
          page_name?: string | null
          platform: string
          token_expiry?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          bot_status?: string
          chatbot_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          page_id?: string
          page_name?: string | null
          platform?: string
          token_expiry?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_messages: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          id: string
          role: string
          telegram_user_id: number
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          telegram_user_id: number
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          telegram_user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "telegram_messages_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_users: {
        Row: {
          chatbot_id: string
          created_at: string
          first_name: string | null
          id: string
          telegram_user_id: number
          username: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          first_name?: string | null
          id?: string
          telegram_user_id: number
          username?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          first_name?: string | null
          id?: string
          telegram_user_id?: number
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_users_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      web_chat_messages: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_chat_messages_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          last_message_at: string
          name: string | null
          phone_number: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          name?: string | null
          phone_number: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          name?: string | null
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          id: string
          phone_number: string
          role: string
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          id?: string
          phone_number: string
          role: string
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          id?: string
          phone_number?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acquire_conversation_lock: {
        Args: {
          p_chatbot_id: string
          p_external_id: string
          p_stale_seconds?: number
          p_timeout_ms?: number
        }
        Returns: boolean
      }
      check_and_increment_rate_limit: {
        Args: {
          p_bucket_key: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      get_chatbot_by_slug: {
        Args: { _slug: string }
        Returns: {
          fallback_message: string
          id: string
          language: string
          name: string
          welcome_message: string
        }[]
      }
      get_chatbot_daily_usage: {
        Args: { _chatbot_id: string }
        Returns: {
          limit_value: number
          plan_name: string
          used: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chatbot_owner: { Args: { chatbot_id: string }; Returns: boolean }
      match_knowledge_items: {
        Args: {
          match_count?: number
          p_chatbot_id: string
          query_embedding: string
        }
        Returns: {
          answer: string
          content: string
          file_url: string
          id: string
          question: string
          similarity: number
          title: string
          type: string
        }[]
      }
      record_customer_contact: {
        Args: {
          _channel: string
          _chatbot_id: string
          _external_id: string
          _last_message?: string
          _name?: string
          _phone?: string
          _username?: string
        }
        Returns: string
      }
      release_conversation_lock: {
        Args: { p_chatbot_id: string; p_external_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "admin" | "platform_admin" | "mill_owner"
      customer_tag: "new" | "prospect" | "regular" | "vip" | "blocked"
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
      app_role: ["user", "admin", "platform_admin", "mill_owner"],
      customer_tag: ["new", "prospect", "regular", "vip", "blocked"],
    },
  },
} as const
