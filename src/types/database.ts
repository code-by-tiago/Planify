export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status: Database["public"]["Enums"]["profile_status"];
          is_admin: boolean;
          is_owner: boolean;
          school_name: string | null;
          phone: string | null;
          stripe_customer_id: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["profile_status"];
          is_admin?: boolean;
          is_owner?: boolean;
          school_name?: string | null;
          phone?: string | null;
          stripe_customer_id?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["profile_status"];
          is_admin?: boolean;
          is_owner?: boolean;
          school_name?: string | null;
          phone?: string | null;
          stripe_customer_id?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      plans: TableDefinition<
        {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          price_in_cents: number;
          currency: string;
          interval: Database["public"]["Enums"]["plan_interval"];
          stripe_price_id: string | null;
          document_limit_per_month: number | null;
          is_active: boolean;
          is_popular: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          price_in_cents?: number;
          currency?: string;
          interval: Database["public"]["Enums"]["plan_interval"];
          stripe_price_id?: string | null;
          document_limit_per_month?: number | null;
          is_active?: boolean;
          is_popular?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          price_in_cents?: number;
          currency?: string;
          interval?: Database["public"]["Enums"]["plan_interval"];
          stripe_price_id?: string | null;
          document_limit_per_month?: number | null;
          is_active?: boolean;
          is_popular?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      subscriptions: TableDefinition<
        {
          id: string;
          user_id: string;
          plan_id: string;
          status: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      documents: TableDefinition<
        {
          id: string;
          user_id: string;
          title: string;
          type: Database["public"]["Enums"]["document_type"];
          status: Database["public"]["Enums"]["document_status"];
          content_html: string | null;
          content_text: string | null;
          storage_path: string | null;
          file_name: string | null;
          file_format: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          title: string;
          type: Database["public"]["Enums"]["document_type"];
          status?: Database["public"]["Enums"]["document_status"];
          content_html?: string | null;
          content_text?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          file_format?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          title?: string;
          type?: Database["public"]["Enums"]["document_type"];
          status?: Database["public"]["Enums"]["document_status"];
          content_html?: string | null;
          content_text?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          file_format?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      lesson_plans: TableDefinition<
        {
          id: string;
          user_id: string;
          document_id: string | null;
          type: Database["public"]["Enums"]["lesson_plan_type"];
          status: Database["public"]["Enums"]["document_status"];
          title: string;
          school_name: string | null;
          teacher_name: string | null;
          subject: string;
          grade: string;
          school_stage: string;
          academic_year: string | null;
          quarter: string | null;
          workload: string | null;
          theme: string | null;
          contents: Json;
          selected_bncc_skill_codes: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          document_id?: string | null;
          type: Database["public"]["Enums"]["lesson_plan_type"];
          status?: Database["public"]["Enums"]["document_status"];
          title: string;
          school_name?: string | null;
          teacher_name?: string | null;
          subject: string;
          grade: string;
          school_stage: string;
          academic_year?: string | null;
          quarter?: string | null;
          workload?: string | null;
          theme?: string | null;
          contents?: Json;
          selected_bncc_skill_codes?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          type?: Database["public"]["Enums"]["lesson_plan_type"];
          status?: Database["public"]["Enums"]["document_status"];
          title?: string;
          school_name?: string | null;
          teacher_name?: string | null;
          subject?: string;
          grade?: string;
          school_stage?: string;
          academic_year?: string | null;
          quarter?: string | null;
          workload?: string | null;
          theme?: string | null;
          contents?: Json;
          selected_bncc_skill_codes?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      teaching_materials: TableDefinition<
        {
          id: string;
          user_id: string;
          document_id: string | null;
          title: string;
          type: Database["public"]["Enums"]["teaching_material_type"];
          status: Database["public"]["Enums"]["document_status"];
          subject: string;
          grade: string;
          school_stage: string;
          theme: string;
          objectives: string[];
          instructions: string[];
          sections: Json;
          selected_bncc_skill_codes: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          document_id?: string | null;
          title: string;
          type: Database["public"]["Enums"]["teaching_material_type"];
          status?: Database["public"]["Enums"]["document_status"];
          subject: string;
          grade: string;
          school_stage: string;
          theme: string;
          objectives?: string[];
          instructions?: string[];
          sections?: Json;
          selected_bncc_skill_codes?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["teaching_material_type"];
          status?: Database["public"]["Enums"]["document_status"];
          subject?: string;
          grade?: string;
          school_stage?: string;
          theme?: string;
          objectives?: string[];
          instructions?: string[];
          sections?: Json;
          selected_bncc_skill_codes?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      bncc_skills: TableDefinition<
        {
          id: string;
          code: string;
          description: string;
          education_stage: string;
          grade: string | null;
          subject: string | null;
          knowledge_area: string | null;
          thematic_unit: string | null;
          knowledge_object: string | null;
          keywords: string[];
          metadata: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          code: string;
          description: string;
          education_stage: string;
          grade?: string | null;
          subject?: string | null;
          knowledge_area?: string | null;
          thematic_unit?: string | null;
          knowledge_object?: string | null;
          keywords?: string[];
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          code?: string;
          description?: string;
          education_stage?: string;
          grade?: string | null;
          subject?: string | null;
          knowledge_area?: string | null;
          thematic_unit?: string | null;
          knowledge_object?: string | null;
          keywords?: string[];
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      user_history: TableDefinition<
        {
          id: string;
          user_id: string;
          entity_id: string | null;
          entity_type: string;
          action: Database["public"]["Enums"]["history_action"];
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          entity_id?: string | null;
          entity_type: string;
          action: Database["public"]["Enums"]["history_action"];
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          entity_id?: string | null;
          entity_type?: string;
          action?: Database["public"]["Enums"]["history_action"];
          title?: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        }
      >;
      marketplace_items: TableDefinition<
        {
          id: string;
          user_id: string;
          document_id: string | null;
          title: string;
          description: string | null;
          category: string;
          subject: string | null;
          grade: string | null;
          school_stage: string | null;
          tags: string[];
          is_published: boolean;
          is_featured: boolean;
          download_count: number;
          rating_average: number;
          metadata: Json;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          document_id?: string | null;
          title: string;
          description?: string | null;
          category: string;
          subject?: string | null;
          grade?: string | null;
          school_stage?: string | null;
          tags?: string[];
          is_published?: boolean;
          is_featured?: boolean;
          download_count?: number;
          rating_average?: number;
          metadata?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          title?: string;
          description?: string | null;
          category?: string;
          subject?: string | null;
          grade?: string | null;
          school_stage?: string | null;
          tags?: string[];
          is_published?: boolean;
          is_featured?: boolean;
          download_count?: number;
          rating_average?: number;
          metadata?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      library_items: TableDefinition<
        {
          id: string;
          created_by: string | null;
          document_id: string | null;
          title: string;
          description: string | null;
          category: string;
          subject: string | null;
          grade: string | null;
          school_stage: string | null;
          tags: string[];
          is_premium: boolean;
          is_published: boolean;
          is_featured: boolean;
          metadata: Json;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          created_by?: string | null;
          document_id?: string | null;
          title: string;
          description?: string | null;
          category: string;
          subject?: string | null;
          grade?: string | null;
          school_stage?: string | null;
          tags?: string[];
          is_premium?: boolean;
          is_published?: boolean;
          is_featured?: boolean;
          metadata?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          created_by?: string | null;
          document_id?: string | null;
          title?: string;
          description?: string | null;
          category?: string;
          subject?: string | null;
          grade?: string | null;
          school_stage?: string | null;
          tags?: string[];
          is_premium?: boolean;
          is_published?: boolean;
          is_featured?: boolean;
          metadata?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      can_access_app: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      has_active_subscription: {
        Args: { target_user_id?: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "teacher" | "school_manager";
      profile_status: "active" | "inactive" | "pending" | "blocked";
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "unpaid";
      plan_interval: "free" | "monthly" | "yearly";
      document_status: "draft" | "ready" | "archived";
      document_type:
        | "planning_annual"
        | "planning_quarterly"
        | "teaching_material"
        | "assessment"
        | "activity"
        | "editor_document";
      lesson_plan_type: "annual" | "quarterly";
      teaching_material_type:
        | "activity"
        | "assessment"
        | "worksheet"
        | "lesson_sequence"
        | "pedagogical_game"
        | "project"
        | "reading_guide";
      history_action:
        | "created"
        | "updated"
        | "opened"
        | "downloaded"
        | "archived"
        | "duplicated";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
