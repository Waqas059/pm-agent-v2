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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
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
