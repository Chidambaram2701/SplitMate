// Database types for RoommateX
// This file defines the database schema for use with Supabase

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      houses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      house_members: {
        Row: {
          id: string;
          house_id: string;
          user_id: string;
          role: 'admin' | 'member';
          status: 'active' | 'left' | 'invited';
          joined_at: string | null;
          left_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          status?: 'active' | 'left' | 'invited';
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          status?: 'active' | 'left' | 'invited';
          joined_at?: string | null;
          left_at?: string | null;
          created_at?: string;
        };
      };
      house_invitations: {
        Row: {
          id: string;
          house_id: string;
          inviter_id: string;
          invitee_email: string;
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          inviter_id: string;
          invitee_email: string;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          inviter_id?: string;
          invitee_email?: string;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          expires_at?: string;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          house_id: string;
          paid_by: string;
          description: string;
          total_amount: number;
          category: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          paid_by: string;
          description: string;
          total_amount: number;
          category?: string;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          paid_by?: string;
          description?: string;
          total_amount?: number;
          category?: string;
          date?: string;
          created_at?: string;
        };
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          participant_id: string;
          amount: number;
          percentage: number;
          settled: boolean;
          settled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          participant_id: string;
          amount: number;
          percentage: number;
          settled?: boolean;
          settled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          participant_id?: string;
          amount?: number;
          percentage?: number;
          settled?: boolean;
          settled_at?: string | null;
          created_at?: string;
        };
      };
      recurring_expenses: {
        Row: {
          id: string;
          house_id: string;
          paid_by: string;
          description: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string | null;
          next_due_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          paid_by: string;
          description: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date?: string | null;
          next_due_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          paid_by?: string;
          description?: string;
          amount?: number;
          frequency?: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          next_due_date?: string;
          created_at?: string;
        };
      };
      debts: {
        Row: {
          id: string;
          house_id: string;
          debtor_id: string;
          creditor_id: string;
          original_amount: number;
          remaining_amount: number;
          due_date: string | null;
          description: string | null;
          status: 'pending' | 'partial' | 'paid' | 'settled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          debtor_id: string;
          creditor_id: string;
          original_amount: number;
          remaining_amount: number;
          due_date?: string | null;
          description?: string | null;
          status?: 'pending' | 'partial' | 'paid' | 'settled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          debtor_id?: string;
          creditor_id?: string;
          original_amount?: number;
          remaining_amount?: number;
          due_date?: string | null;
          description?: string | null;
          status?: 'pending' | 'partial' | 'paid' | 'settled';
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          debt_id: string;
          amount: number;
          payment_date: string;
          payment_method: 'upi' | 'cash' | 'bank' | 'wallet' | 'other';
          reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          amount: number;
          payment_date?: string;
          payment_method: 'upi' | 'cash' | 'bank' | 'wallet' | 'other';
          reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          debt_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: 'upi' | 'cash' | 'bank' | 'wallet' | 'other';
          reference?: string | null;
          created_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          house_id: string;
          name: string;
          description: string | null;
          purchase_price: number;
          current_value: number;
          purchase_date: string;
          status: 'active' | 'sold' | 'transferred' | 'damaged';
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          name: string;
          description?: string | null;
          purchase_price: number;
          current_value: number;
          purchase_date?: string;
          status?: 'active' | 'sold' | 'transferred' | 'damaged';
          created_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          name?: string;
          description?: string | null;
          purchase_price?: number;
          current_value?: number;
          purchase_date?: string;
          status?: 'active' | 'sold' | 'transferred' | 'damaged';
          created_at?: string;
        };
      };
      asset_contributions: {
        Row: {
          id: string;
          asset_id: string;
          member_id: string;
          contribution_amount: number;
          ownership_percentage: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          member_id: string;
          contribution_amount: number;
          ownership_percentage: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          member_id?: string;
          contribution_amount?: number;
          ownership_percentage?: number;
          created_at?: string;
        };
      };
      asset_transfers: {
        Row: {
          id: string;
          asset_id: string;
          from_member_id: string;
          to_member_id: string;
          transfer_date: string;
          transfer_amount: number | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          from_member_id: string;
          to_member_id: string;
          transfer_date?: string;
          transfer_amount?: number | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          from_member_id?: string;
          to_member_id?: string;
          transfer_date?: string;
          transfer_amount?: number | null;
          description?: string | null;
          created_at?: string;
        };
      };
      asset_sales: {
        Row: {
          id: string;
          asset_id: string;
          sale_date: string;
          sale_price: number;
          buyer: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          sale_date?: string;
          sale_price: number;
          buyer?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          sale_date?: string;
          sale_price?: number;
          buyer?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      settlements: {
        Row: {
          id: string;
          house_id: string;
          settled_by: string;
          description: string;
          total_amount: number;
          status: 'pending' | 'completed' | 'cancelled';
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          settled_by: string;
          description: string;
          total_amount: number;
          status?: 'pending' | 'completed' | 'cancelled';
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string;
          settled_by?: string;
          description?: string;
          total_amount?: number;
          status?: 'pending' | 'completed' | 'cancelled';
          completed_at?: string | null;
          created_at?: string;
        };
      };
      settlement_transactions: {
        Row: {
          id: string;
          settlement_id: string;
          from_member_id: string;
          to_member_id: string;
          amount: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          settlement_id: string;
          from_member_id: string;
          to_member_id: string;
          amount: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          settlement_id?: string;
          from_member_id?: string;
          to_member_id?: string;
          amount?: number;
          description?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          house_id: string;
          payment_reminder: boolean;
          payment_received: boolean;
          expense_added: boolean;
          asset_update: boolean;
          settlement: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          house_id: string;
          payment_reminder?: boolean;
          payment_received?: boolean;
          expense_added?: boolean;
          asset_update?: boolean;
          settlement?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          house_id?: string;
          payment_reminder?: boolean;
          payment_received?: boolean;
          expense_added?: boolean;
          asset_update?: boolean;
          settlement?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          house_id: string | null;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id?: string | null;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          house_id?: string | null;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      expense_category: 'general' | 'rent' | 'utilities' | 'groceries' | 'entertainment' | 'other';
      debt_status: 'pending' | 'partial' | 'paid' | 'settled';
      asset_status: 'active' | 'sold' | 'transferred' | 'damaged';
      settlement_status: 'pending' | 'completed' | 'cancelled';
      payment_method: 'upi' | 'cash' | 'bank' | 'wallet' | 'other';
      notification_type: 'payment_reminder' | 'payment_received' | 'expense_added' | 'asset_update' | 'settlement' | 'house_invitation';
    };
  };
}
