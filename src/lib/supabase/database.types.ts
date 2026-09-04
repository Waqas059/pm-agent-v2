export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["workspace_member_role"];
          joined_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["workspace_member_role"];
          joined_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["workspace_member_role"];
          joined_at?: string;
        };
        Relationships: [];
      };
      context_items: {
        Row: {
          id: string;
          workspace_id: string;
          category: Database["public"]["Enums"]["context_category"];
          title: string;
          content: string;
          source_type: Database["public"]["Enums"]["context_source_type"];
          provenance: Json;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          category: Database["public"]["Enums"]["context_category"];
          title: string;
          content: string;
          source_type: Database["public"]["Enums"]["context_source_type"];
          provenance?: Json;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          category?: Database["public"]["Enums"]["context_category"];
          title?: string;
          content?: string;
          source_type?: Database["public"]["Enums"]["context_source_type"];
          provenance?: Json;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          original_name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          status: Database["public"]["Enums"]["document_status"];
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          original_name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          status?: Database["public"]["Enums"]["document_status"];
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          original_name?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          status?: Database["public"]["Enums"]["document_status"];
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      evidence_items: {
        Row: {
          id: string;
          workspace_id: string;
          document_id: string | null;
          kind: Database["public"]["Enums"]["evidence_kind"];
          title: string;
          content: string;
          source_label: string;
          source_locator: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
          search_vector: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          document_id?: string | null;
          kind: Database["public"]["Enums"]["evidence_kind"];
          title: string;
          content: string;
          source_label: string;
          source_locator?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          document_id?: string | null;
          kind?: Database["public"]["Enums"]["evidence_kind"];
          title?: string;
          content?: string;
          source_label?: string;
          source_locator?: Json;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      evidence_citations: {
        Row: {
          id: string;
          workspace_id: string;
          evidence_item_id: string;
          citation_key: string;
          label: string;
          locator: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          evidence_item_id: string;
          citation_key: string;
          label: string;
          locator?: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          evidence_item_id?: string;
          citation_key?: string;
          label?: string;
          locator?: Json;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      artifacts: {
        Row: {
          id: string;
          workspace_id: string;
          kind: Database["public"]["Enums"]["artifact_kind"];
          title: string;
          source_workflow: "define_specify" | "align_communicate";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          kind: Database["public"]["Enums"]["artifact_kind"];
          title: string;
          source_workflow: "define_specify" | "align_communicate";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          kind?: Database["public"]["Enums"]["artifact_kind"];
          title?: string;
          source_workflow?: "define_specify" | "align_communicate";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      artifact_versions: {
        Row: {
          id: string;
          artifact_id: string;
          workspace_id: string;
          version: number;
          content: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          artifact_id: string;
          workspace_id: string;
          version: number;
          content: Json;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          artifact_id?: string;
          workspace_id?: string;
          version?: number;
          content?: Json;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workflow_runs: {
        Row: {
          id: string;
          workspace_id: string;
          workflow_name: "pm_chain" | "discover_synthesize" | "define_specify" | "align_communicate";
          status: "running" | "completed" | "failed";
          input: Json;
          output: Json | null;
          error_message: string | null;
          created_by: string;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          workflow_name: "pm_chain" | "discover_synthesize" | "define_specify" | "align_communicate";
          status?: "running" | "completed" | "failed";
          input: Json;
          output?: Json | null;
          error_message?: string | null;
          created_by: string;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          workflow_name?: "pm_chain" | "discover_synthesize" | "define_specify" | "align_communicate";
          status?: "running" | "completed" | "failed";
          input?: Json;
          output?: Json | null;
          error_message?: string | null;
          created_by?: string;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workflow_run_steps: {
        Row: {
          id: string;
          workflow_run_id: string;
          workspace_id: string;
          step_key: "discover" | "define" | "align" | "artifact_persist";
          step_order: number;
          status: "running" | "completed" | "failed";
          input: Json;
          output: Json | null;
          error_message: string | null;
          created_by: string;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_run_id: string;
          workspace_id: string;
          step_key: "discover" | "define" | "align" | "artifact_persist";
          step_order: number;
          status?: "running" | "completed" | "failed";
          input: Json;
          output?: Json | null;
          error_message?: string | null;
          created_by: string;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_run_id?: string;
          workspace_id?: string;
          step_key?: "discover" | "define" | "align" | "artifact_persist";
          step_order?: number;
          status?: "running" | "completed" | "failed";
          input?: Json;
          output?: Json | null;
          error_message?: string | null;
          created_by?: string;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      document_status: "uploaded" | "processing" | "ready" | "failed";
      artifact_kind: "product_brief" | "communication_message";
      evidence_kind: "quote" | "observation" | "metric";
      workspace_member_role: "owner" | "member" | "viewer";
      context_category:
        | "product"
        | "goals"
        | "personas"
        | "strategy"
        | "constraints"
        | "metrics"
        | "decisions"
        | "assumptions";
      context_source_type: "user_input" | "imported" | "generated";
    };
    CompositeTypes: Record<string, never>;
  };
};
