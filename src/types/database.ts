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
  Relationships: [];
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
          bio: string | null;
          community_public: boolean;
          phone: string | null;
          stripe_customer_id: string | null;
          plan: string | null;
          last_login_at: string | null;
          correction_profile: Json | null;
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
          bio?: string | null;
          community_public?: boolean;
          phone?: string | null;
          stripe_customer_id?: string | null;
          plan?: string | null;
          last_login_at?: string | null;
          correction_profile?: Json | null;
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
          bio?: string | null;
          community_public?: boolean;
          phone?: string | null;
          stripe_customer_id?: string | null;
          plan?: string | null;
          last_login_at?: string | null;
          correction_profile?: Json | null;
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
      marketplace_materials: TableDefinition<
        {
          id: string;
          user_id: string | null;
          owner_email: string | null;
          author_name: string | null;
          title: string;
          description: string | null;
          etapa: string | null;
          ano_serie: string | null;
          componente: string | null;
          tipo_material: string | null;
          tema: string | null;
          tags: string[] | null;
          file_name: string | null;
          file_path: string | null;
          file_mime: string | null;
          file_size: number | null;
          is_published: boolean | null;
          downloads_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        },
        {
          id?: string;
          user_id?: string | null;
          owner_email?: string | null;
          author_name?: string | null;
          title: string;
          description?: string | null;
          etapa?: string | null;
          ano_serie?: string | null;
          componente?: string | null;
          tipo_material?: string | null;
          tema?: string | null;
          tags?: string[] | null;
          file_name?: string | null;
          file_path?: string | null;
          file_mime?: string | null;
          file_size?: number | null;
          is_published?: boolean | null;
          downloads_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        },
        {
          id?: string;
          user_id?: string | null;
          owner_email?: string | null;
          author_name?: string | null;
          title?: string;
          description?: string | null;
          etapa?: string | null;
          ano_serie?: string | null;
          componente?: string | null;
          tipo_material?: string | null;
          tema?: string | null;
          tags?: string[] | null;
          file_name?: string | null;
          file_path?: string | null;
          file_mime?: string | null;
          file_size?: number | null;
          is_published?: boolean | null;
          downloads_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
      >;
      marketplace_material_likes: TableDefinition<
        {
          id: string;
          material_id: string;
          user_id: string;
          created_at: string;
        },
        {
          id?: string;
          material_id: string;
          user_id: string;
          created_at?: string;
        },
        {
          id?: string;
          material_id?: string;
          user_id?: string;
          created_at?: string;
        }
      >;
      marketplace_material_comments: TableDefinition<
        {
          id: string;
          material_id: string;
          user_id: string | null;
          author_name: string;
          author_email: string | null;
          body: string;
          created_at: string;
        },
        {
          id?: string;
          material_id: string;
          user_id?: string | null;
          author_name?: string;
          author_email?: string | null;
          body: string;
          created_at?: string;
        },
        {
          id?: string;
          material_id?: string;
          user_id?: string | null;
          author_name?: string;
          author_email?: string | null;
          body?: string;
          created_at?: string;
        }
      >;
      community_friendships: TableDefinition<
        {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      community_conversations: TableDefinition<
        {
          id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_a_id?: string;
          user_b_id?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      community_messages: TableDefinition<
        {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
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
      schools: TableDefinition<
        {
          id: string;
          name: string;
          slug: string | null;
          city: string | null;
          state: string | null;
          director_user_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          slug?: string | null;
          city?: string | null;
          state?: string | null;
          director_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          slug?: string | null;
          city?: string | null;
          state?: string | null;
          director_user_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      teacher_classes: TableDefinition<
        {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      school_classes: TableDefinition<
        {
          id: string;
          school_id: string;
          name: string;
          grade_level: string | null;
          year: number | null;
          discipline: string | null;
          teacher_user_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          school_id: string;
          name: string;
          grade_level?: string | null;
          year?: number | null;
          discipline?: string | null;
          teacher_user_id?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          school_id?: string;
          name?: string;
          grade_level?: string | null;
          year?: number | null;
          discipline?: string | null;
          teacher_user_id?: string | null;
          created_at?: string;
        }
      >;
      school_memberships: TableDefinition<
        {
          id: string;
          school_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["school_membership_role"];
          status: Database["public"]["Enums"]["school_membership_status"];
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          school_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["school_membership_role"];
          status?: Database["public"]["Enums"]["school_membership_status"];
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          school_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["school_membership_role"];
          status?: Database["public"]["Enums"]["school_membership_status"];
          created_at?: string;
          updated_at?: string;
        }
      >;
      school_invites: TableDefinition<
        {
          id: string;
          school_id: string;
          email: string;
          status: Database["public"]["Enums"]["school_invite_status"];
          invited_by: string | null;
          accepted_user_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          school_id: string;
          email: string;
          status?: Database["public"]["Enums"]["school_invite_status"];
          invited_by?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          school_id?: string;
          email?: string;
          status?: Database["public"]["Enums"]["school_invite_status"];
          invited_by?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      generated_materials: TableDefinition<
        {
          id: string;
          user_id: string;
          school_id: string | null;
          class_id: string | null;
          class_name: string | null;
          discipline: string | null;
          school_year: number;
          tipo: string;
          title: string;
          material_type: string;
          request_payload: Json;
          response_json: Json;
          html_editor: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          credit_cost: number;
          request_hash: string;
          idempotency_key: string;
          status: string;
          bncc_skill_codes: string[];
          bncc_skills: Json;
          content_preview: string;
          content_html: string | null;
          raw: Json;
          pipeline: string | null;
          quality_score: number | null;
          surface: Database["public"]["Enums"]["generated_material_surface"];
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          school_id?: string | null;
          class_id?: string | null;
          class_name?: string | null;
          discipline?: string | null;
          school_year?: number;
          tipo?: string;
          title?: string;
          material_type?: string;
          request_payload?: Json;
          response_json?: Json;
          html_editor?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          credit_cost?: number;
          request_hash?: string;
          idempotency_key?: string;
          status?: string;
          bncc_skill_codes?: string[];
          bncc_skills?: Json;
          content_preview?: string;
          content_html?: string | null;
          raw?: Json;
          pipeline?: string | null;
          quality_score?: number | null;
          surface?: Database["public"]["Enums"]["generated_material_surface"];
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          school_id?: string | null;
          class_id?: string | null;
          class_name?: string | null;
          discipline?: string | null;
          school_year?: number;
          tipo?: string;
          title?: string;
          material_type?: string;
          request_payload?: Json;
          response_json?: Json;
          html_editor?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          credit_cost?: number;
          request_hash?: string;
          idempotency_key?: string;
          status?: string;
          bncc_skill_codes?: string[];
          bncc_skills?: Json;
          content_preview?: string;
          content_html?: string | null;
          raw?: Json;
          pipeline?: string | null;
          quality_score?: number | null;
          surface?: Database["public"]["Enums"]["generated_material_surface"];
          created_at?: string;
          updated_at?: string;
        }
      >;
      generation_jobs: TableDefinition<
        {
          id: string;
          user_id: string | null;
          surface: string;
          tipo: string;
          status: string;
          stage: string;
          progress: number;
          message: string;
          pipeline: string;
          payload: Json;
          result: Json | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        },
        {
          id?: string;
          user_id?: string | null;
          surface: string;
          tipo?: string;
          status?: string;
          stage?: string;
          progress?: number;
          message?: string;
          pipeline?: string;
          payload?: Json;
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        },
        {
          id?: string;
          user_id?: string | null;
          surface?: string;
          tipo?: string;
          status?: string;
          stage?: string;
          progress?: number;
          message?: string;
          pipeline?: string;
          payload?: Json;
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        }
      >;
      question_bank_items: TableDefinition<
        {
          id: string;
          user_id: string;
          school_id: string | null;
          enunciado: string;
          tipo: string;
          alternativas: Json;
          resposta_esperada: string;
          criterio_correcao: string;
          componente: string;
          ano_serie: string;
          etapa: string;
          tema: string;
          bncc_codigos: string[];
          tags: string[];
          source_title: string | null;
          source_type: string | null;
          content_hash: string;
          visibility: string;
          is_published: boolean;
          published_at: string | null;
          usage_count: number;
          author_display_name: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          school_id?: string | null;
          enunciado: string;
          tipo?: string;
          alternativas?: Json;
          resposta_esperada?: string;
          criterio_correcao?: string;
          componente: string;
          ano_serie?: string;
          etapa?: string;
          tema?: string;
          bncc_codigos?: string[];
          tags?: string[];
          source_title?: string | null;
          source_type?: string | null;
          content_hash: string;
          visibility?: string;
          is_published?: boolean;
          published_at?: string | null;
          usage_count?: number;
          author_display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          user_id?: string;
          school_id?: string | null;
          enunciado?: string;
          tipo?: string;
          alternativas?: Json;
          resposta_esperada?: string;
          criterio_correcao?: string;
          componente?: string;
          ano_serie?: string;
          etapa?: string;
          tema?: string;
          bncc_codigos?: string[];
          tags?: string[];
          source_title?: string | null;
          source_type?: string | null;
          content_hash?: string;
          visibility?: string;
          is_published?: boolean;
          published_at?: string | null;
          usage_count?: number;
          author_display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      pedagogical_sources: TableDefinition<
        {
          id: string;
          slug: string;
          name: string;
          adapter_type: string;
          base_url: string;
          license_label: string;
          attribution_template: string | null;
          config: Json;
          is_active: boolean;
          priority: number;
          robots_respected: boolean;
          last_success_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          slug: string;
          name: string;
          adapter_type: string;
          base_url: string;
          license_label: string;
          attribution_template?: string | null;
          config?: Json;
          is_active?: boolean;
          priority?: number;
          robots_respected?: boolean;
          last_success_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          slug?: string;
          name?: string;
          adapter_type?: string;
          base_url?: string;
          license_label?: string;
          attribution_template?: string | null;
          config?: Json;
          is_active?: boolean;
          priority?: number;
          robots_respected?: boolean;
          last_success_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      pedagogical_cache_entries: TableDefinition<
        {
          id: string;
          topic_signature: string;
          content_hash: string;
          title: string;
          summary: string;
          body_markdown: string;
          content_type: string;
          componente: string | null;
          ano_serie: string | null;
          etapa: string | null;
          bncc_codigos: string[];
          tags: string[];
          source_id: string;
          source_url: string | null;
          source_title: string | null;
          source_license: string | null;
          source_fetched_at: string;
          review_status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          format_applied: boolean;
          ai_tokens_used: number;
          hit_count: number;
          last_hit_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          topic_signature: string;
          content_hash: string;
          title: string;
          summary: string;
          body_markdown: string;
          content_type?: string;
          componente?: string | null;
          ano_serie?: string | null;
          etapa?: string | null;
          bncc_codigos?: string[];
          tags?: string[];
          source_id: string;
          source_url?: string | null;
          source_title?: string | null;
          source_license?: string | null;
          source_fetched_at?: string;
          review_status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          format_applied?: boolean;
          ai_tokens_used?: number;
          hit_count?: number;
          last_hit_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          topic_signature?: string;
          content_hash?: string;
          title?: string;
          summary?: string;
          body_markdown?: string;
          content_type?: string;
          componente?: string | null;
          ano_serie?: string | null;
          etapa?: string | null;
          bncc_codigos?: string[];
          tags?: string[];
          source_id?: string;
          source_url?: string | null;
          source_title?: string | null;
          source_license?: string | null;
          source_fetched_at?: string;
          review_status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          format_applied?: boolean;
          ai_tokens_used?: number;
          hit_count?: number;
          last_hit_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      pedagogical_cache_aliases: TableDefinition<
        {
          id: string;
          entry_id: string;
          alias_key: string;
          alias_type: string;
        },
        {
          id?: string;
          entry_id: string;
          alias_key: string;
          alias_type?: string;
        },
        {
          id?: string;
          entry_id?: string;
          alias_key?: string;
          alias_type?: string;
        }
      >;
      pedagogical_scrape_jobs: TableDefinition<
        {
          id: string;
          trigger: string;
          query: Json;
          status: string;
          sources_attempted: string[];
          entries_created: number;
          entries_updated: number;
          error_code: string | null;
          error_message: string | null;
          duration_ms: number | null;
          requested_by: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          trigger: string;
          query: Json;
          status?: string;
          sources_attempted?: string[];
          entries_created?: number;
          entries_updated?: number;
          error_code?: string | null;
          error_message?: string | null;
          duration_ms?: number | null;
          requested_by?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          trigger?: string;
          query?: Json;
          status?: string;
          sources_attempted?: string[];
          entries_created?: number;
          entries_updated?: number;
          error_code?: string | null;
          error_message?: string | null;
          duration_ms?: number | null;
          requested_by?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        }
      >;
      pedagogical_cache_usage: TableDefinition<
        {
          id: string;
          entry_id: string | null;
          user_id: string | null;
          usage_type: string;
          tokens_saved_estimate: number;
          ai_tokens_spent: number;
          tool_tipo: string | null;
          created_at: string;
        },
        {
          id?: string;
          entry_id?: string | null;
          user_id?: string | null;
          usage_type: string;
          tokens_saved_estimate?: number;
          ai_tokens_spent?: number;
          tool_tipo?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          entry_id?: string | null;
          user_id?: string | null;
          usage_type?: string;
          tokens_saved_estimate?: number;
          ai_tokens_spent?: number;
          tool_tipo?: string | null;
          created_at?: string;
        }
      >;
      operational_events: TableDefinition<
        {
          id: string;
          created_at: string;
          event_type: string;
          tool_tipo: string;
          ok: boolean;
          error_code: string | null;
          duration_ms: number | null;
          metadata: Json;
        },
        {
          id?: string;
          created_at?: string;
          event_type: string;
          tool_tipo?: string;
          ok?: boolean;
          error_code?: string | null;
          duration_ms?: number | null;
          metadata?: Json;
        },
        {
          id?: string;
          created_at?: string;
          event_type?: string;
          tool_tipo?: string;
          ok?: boolean;
          error_code?: string | null;
          duration_ms?: number | null;
          metadata?: Json;
        }
      >;
      platform_settings: TableDefinition<
        {
          key: string;
          value: Json;
          updated_at: string;
        },
        {
          key: string;
          value?: Json;
          updated_at?: string;
        },
        {
          key?: string;
          value?: Json;
          updated_at?: string;
        }
      >;
      lesson_simulator_rate_limits: TableDefinition<
        {
          rate_key: string;
          used_at: string;
        },
        {
          rate_key: string;
          used_at?: string;
        },
        {
          rate_key?: string;
          used_at?: string;
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
      planify_get_lesson_simulator_usage: {
        Args: { p_ip: string | null; p_fingerprint: string };
        Returns: number;
      };
      planify_consume_lesson_simulator_usage: {
        Args: { p_ip: string | null; p_fingerprint: string };
        Returns: number;
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
      school_membership_role: "director" | "teacher" | "coordinator";
      school_membership_status: "active" | "inactive";
      school_invite_status: "pending" | "accepted" | "revoked";
      generated_material_surface: "material" | "planning" | "inclusao";
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
