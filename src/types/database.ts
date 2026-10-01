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
      clients: {
        Row: {
          id: string
          client_code: string
          client_name: string | null
          city: string | null
          header_balance: number | null
          bank_name: string | null
          bank_account: string | null
          bank_iban: string | null
          created_at: string
          updated_at: string
          org_id?: string | null
        }
        Insert: {
          id?: string
          client_code: string
          client_name?: string | null
          city?: string | null
          header_balance?: number | null
          bank_name?: string | null
          bank_account?: string | null
          bank_iban?: string | null
          created_at?: string
          updated_at?: string
          org_id?: string | null
        }
        Update: {
          id?: string
          client_code?: string
          client_name?: string | null
          city?: string | null
          header_balance?: number | null
          bank_name?: string | null
          bank_account?: string | null
          bank_iban?: string | null
          created_at?: string
          updated_at?: string
          org_id?: string | null
        }
      }
      ledger_entries: {
        Row: {
          id: string
          client_code: string
          entry_date: string | null
          folder_no: string | null
          stage: string | null
          tm_no: string | null
          details: string | null
          amount_due: number | null
          amount_received: number | null
          running_balance: number | null
          entry_type: string | null
          created_at: string
          org_id?: string | null
        }
        Insert: {
          id?: string
          client_code: string
          entry_date?: string | null
          folder_no?: string | null
          stage?: string | null
          tm_no?: string | null
          details?: string | null
          amount_due?: number | null
          amount_received?: number | null
          running_balance?: number | null
          created_at?: string
          org_id?: string | null
        }
        Update: {
          id?: string
          client_code?: string
          entry_date?: string | null
          folder_no?: string | null
          stage?: string | null
          tm_no?: string | null
          details?: string | null
          amount_due?: number | null
          amount_received?: number | null
          running_balance?: number | null
          created_at?: string
          org_id?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: 'owner' | 'admin' | 'member' | 'viewer'
          org_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          org_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          org_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
    }
    Views: {
      client_balances: {
        Row: {
          client_code: string | null
          client_name: string | null
          city: string | null
          header_balance: number | null
          total_due: number | null
          total_received: number | null
          current_balance: number | null
          entry_count: number | null
        }
      }
    }
  }
}

export type Client = Database['public']['Tables']['clients']['Row']
export type LedgerEntry = Database['public']['Tables']['ledger_entries']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type ClientBalance = Database['public']['Views']['client_balances']['Row']