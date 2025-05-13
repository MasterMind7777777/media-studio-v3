export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      content_packs: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          thumbnail_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          thumbnail_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          content_pack_id: string | null
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          name: string
          thumbnail_url: string | null
          user_id: string | null
        }
        Insert: {
          content_pack_id?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          name: string
          thumbnail_url?: string | null
          user_id?: string | null
        }
        Update: {
          content_pack_id?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          name?: string
          thumbnail_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_content_pack_id_fkey"
            columns: ["content_pack_id"]
            isOneToOne: false
            referencedRelation: "content_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          role?: string
        }
        Relationships: []
      }
      render_jobs: {
        Row: {
          created_at: string | null
          creatomate_render_ids: string[] | null
          id: string
          output_urls: Json | null
          platforms: Json | null
          status: string | null
          template_id: string
          updated_at: string | null
          user_id: string
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          creatomate_render_ids?: string[] | null
          id?: string
          output_urls?: Json | null
          platforms?: Json | null
          status?: string | null
          template_id: string
          updated_at?: string | null
          user_id: string
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          creatomate_render_ids?: string[] | null
          id?: string
          output_urls?: Json | null
          platforms?: Json | null
          status?: string | null
          template_id?: string
          updated_at?: string | null
          user_id?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          value?: string
        }
        Relationships: []
      }
      statistics: {
        Row: {
          active_users: number | null
          date: string
          id: string
          platform_breakdown: Json | null
          processing_time: number | null
          renders_count: number | null
          storage_used: number | null
        }
        Insert: {
          active_users?: number | null
          date: string
          id?: string
          platform_breakdown?: Json | null
          processing_time?: number | null
          renders_count?: number | null
          storage_used?: number | null
        }
        Update: {
          active_users?: number | null
          date?: string
          id?: string
          platform_breakdown?: Json | null
          processing_time?: number | null
          renders_count?: number | null
          storage_used?: number | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string | null
          created_at: string | null
          creatomate_template_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          platforms: Json | null
          preview_image_url: string | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creatomate_template_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platforms?: Json | null
          preview_image_url?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creatomate_template_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platforms?: Json | null
          preview_image_url?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
