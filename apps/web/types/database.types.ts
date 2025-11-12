// Database types - will be generated from Supabase
// Run: supabase gen types typescript --linked > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      people: {
        Row: {
          id: string
          org_id: string
          company_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          title: string | null
          linkedin_url: string | null
          tags: string[]
          owner_id: string | null
          last_contacted_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          company_id?: string | null
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          title?: string | null
          linkedin_url?: string | null
          tags?: string[]
          owner_id?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          company_id?: string | null
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          title?: string | null
          linkedin_url?: string | null
          tags?: string[]
          owner_id?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          org_id: string
          name: string
          website: string | null
          phone: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          tags: string[]
          owner_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          website?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          tags?: string[]
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          website?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          tags?: string[]
          owner_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      deals: {
        Row: {
          id: string
          org_id: string
          pipeline_id: string
          stage_id: string
          company_id: string | null
          person_id: string | null
          name: string
          value_cents: number | null
          currency: string
          owner_id: string | null
          expected_close_date: string | null
          status: 'open' | 'won' | 'lost'
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          pipeline_id: string
          stage_id: string
          company_id?: string | null
          person_id?: string | null
          name: string
          value_cents?: number | null
          currency?: string
          owner_id?: string | null
          expected_close_date?: string | null
          status?: 'open' | 'won' | 'lost'
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          pipeline_id?: string
          stage_id?: string
          company_id?: string | null
          person_id?: string | null
          name?: string
          value_cents?: number | null
          currency?: string
          owner_id?: string | null
          expected_close_date?: string | null
          status?: 'open' | 'won' | 'lost'
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

