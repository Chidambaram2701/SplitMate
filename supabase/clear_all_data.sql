-- ============================================
-- RoommateX - RESET & CLEAR ALL APPLICATION DATA
-- Run this script in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================

-- Disable RLS temporarily for truncation
SET session_replication_role = 'replica';

-- Truncate all application data tables
TRUNCATE TABLE 
  payments, 
  debts, 
  expense_splits, 
  expenses, 
  recurring_expenses, 
  asset_contributions, 
  assets, 
  house_invitations, 
  house_members, 
  houses 
RESTART IDENTITY CASCADE;

-- Re-enable RLS
SET session_replication_role = 'origin';

-- Optional: Delete non-essential profiles (uncomment if you want to reset all profiles as well)
-- DELETE FROM profiles;

SELECT 'All demo and test data deleted successfully!' AS result;
