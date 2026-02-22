export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'ADMIN' | 'EDITOR' | 'MEMBER' | 'GUEST';

export interface Database {
  public: {
    Tables: {
      site_settings: {
        Row: {
          id: number;
          band_name: string;
          logo_url: string;
          primary_color: string;
          secondary_color: string;
          footer_text: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['site_settings']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>;
      };
      pages: {
        Row: {
          id: string;
          title: string;
          slug: string;
          layout: string;
          sidebar_width: number;
          sections: Json;
          sidebar_blocks: Json | null;
          show_in_nav: boolean | null;
          nav_order: number | null;
          nav_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pages']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['pages']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          role: AppRole;
          email: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
  };
}
