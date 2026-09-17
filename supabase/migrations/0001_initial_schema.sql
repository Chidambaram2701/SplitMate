-- RoommateX Database Schema
-- Multi-tenant house financial management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- HOUSES TABLE
-- ============================================
CREATE TABLE houses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- HOUSE_MEMBERS TABLE
-- ============================================
CREATE TABLE house_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left', 'invited')),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- HOUSE_INVITATIONS TABLE
-- ============================================
CREATE TABLE house_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  category TEXT NOT NULL DEFAULT 'general',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- EXPENSE_SPLITS TABLE
-- ============================================
CREATE TABLE expense_splits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  settled BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- RECURRING_EXPENSES TABLE
-- ============================================
CREATE TABLE recurring_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- DEBTS TABLE
-- ============================================
CREATE TABLE debts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  debtor_id UUID REFERENCES auth.users(id) NOT NULL,
  creditor_id UUID REFERENCES auth.users(id) NOT NULL,
  original_amount NUMERIC(12, 2) NOT NULL CHECK (original_amount >= 0),
  remaining_amount NUMERIC(12, 2) NOT NULL CHECK (remaining_amount >= 0),
  due_date DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'settled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'cash', 'bank', 'wallet', 'other')),
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ASSETS TABLE
-- ============================================
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
  current_value NUMERIC(12, 2) NOT NULL CHECK (current_value >= 0),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'transferred', 'damaged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ASSET_CONTRIBUTIONS TABLE
-- ============================================
CREATE TABLE asset_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES auth.users(id) NOT NULL,
  contribution_amount NUMERIC(12, 2) NOT NULL CHECK (contribution_amount >= 0),
  ownership_percentage NUMERIC(5, 2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ASSET_TRANSFERS TABLE
-- ============================================
CREATE TABLE asset_transfers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  from_member_id UUID REFERENCES auth.users(id) NOT NULL,
  to_member_id UUID REFERENCES auth.users(id) NOT NULL,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transfer_amount NUMERIC(12, 2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- ASSET_SALES TABLE
-- ============================================
CREATE TABLE asset_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price >= 0),
  buyer UUID REFERENCES auth.users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- SETTLEMENTS TABLE
-- ============================================
CREATE TABLE settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  settled_by UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- SETTLEMENT_TRANSACTIONS TABLE
-- ============================================
CREATE TABLE settlement_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  settlement_id UUID REFERENCES settlements(id) ON DELETE CASCADE NOT NULL,
  from_member_id UUID REFERENCES auth.users(id) NOT NULL,
  to_member_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- NOTIFICATION_PREFERENCES TABLE
-- ============================================
CREATE TABLE notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  payment_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  payment_received BOOLEAN NOT NULL DEFAULT TRUE,
  expense_added BOOLEAN NOT NULL DEFAULT TRUE,
  asset_update BOOLEAN NOT NULL DEFAULT TRUE,
  settlement BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, house_id)
);

-- ============================================
-- AUDIT_LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- INDICES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_house_members_house_id ON house_members(house_id);
CREATE INDEX idx_house_members_user_id ON house_members(user_id);
CREATE INDEX idx_expenses_house_id ON expenses(house_id);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_debts_house_id ON debts(house_id);
CREATE INDEX idx_debts_debtor_id ON debts(debtor_id);
CREATE INDEX idx_debts_creditor_id ON debts(creditor_id);
CREATE INDEX idx_payments_debt_id ON payments(debt_id);
CREATE INDEX idx_assets_house_id ON assets(house_id);
CREATE INDEX idx_asset_contributions_asset_id ON asset_contributions(asset_id);
CREATE INDEX idx_asset_contributions_member_id ON asset_contributions(member_id);
CREATE INDEX idx_asset_transfers_asset_id ON asset_transfers(asset_id);
CREATE INDEX idx_asset_transfers_from_member_id ON asset_transfers(from_member_id);
CREATE INDEX idx_asset_transfers_to_member_id ON asset_transfers(to_member_id);
CREATE INDEX idx_asset_sales_asset_id ON asset_sales(asset_id);
CREATE INDEX idx_settlements_house_id ON settlements(house_id);
CREATE INDEX idx_settlement_transactions_settlement_id ON settlement_transactions(settlement_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_audit_logs_house_id ON audit_logs(house_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: PROFILES
-- ============================================
DROP POLICY IF EXISTS profiles_can_view_own_profile ON profiles;
DROP POLICY IF EXISTS profiles_can_view_all ON profiles;

CREATE POLICY profiles_can_view_all ON profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_can_update_own_profile ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Helper function to bypass RLS recursion safely
CREATE OR REPLACE FUNCTION get_user_house_ids(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT house_id FROM house_members WHERE user_id = user_uuid AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================
-- RLS POLICIES: HOUSES
-- ============================================
DROP POLICY IF EXISTS houses_can_view_owned ON houses;
DROP POLICY IF EXISTS houses_can_view_member ON houses;
DROP POLICY IF EXISTS houses_can_view ON houses;
DROP POLICY IF EXISTS houses_can_insert_admin ON houses;
DROP POLICY IF EXISTS houses_can_insert ON houses;
DROP POLICY IF EXISTS houses_can_update_admin ON houses;
DROP POLICY IF EXISTS houses_can_update ON houses;
DROP POLICY IF EXISTS houses_can_delete_admin ON houses;
DROP POLICY IF EXISTS houses_can_delete ON houses;

CREATE POLICY houses_can_view ON houses
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (SELECT get_user_house_ids(auth.uid()))
  );

CREATE POLICY houses_can_insert ON houses
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
  );

CREATE POLICY houses_can_update ON houses
  FOR UPDATE USING (
    owner_id = auth.uid()
  );

CREATE POLICY houses_can_delete ON houses
  FOR DELETE USING (
    owner_id = auth.uid()
  );

-- ============================================
-- RLS POLICIES: HOUSE_MEMBERS
-- ============================================
DROP POLICY IF EXISTS house_members_can_view ON house_members;
DROP POLICY IF EXISTS house_members_can_insert_member ON house_members;
DROP POLICY IF EXISTS house_members_can_insert ON house_members;
DROP POLICY IF EXISTS house_members_can_update_admin ON house_members;
DROP POLICY IF EXISTS house_members_can_update ON house_members;
DROP POLICY IF EXISTS house_members_can_delete_member ON house_members;
DROP POLICY IF EXISTS house_members_can_delete ON house_members;

CREATE POLICY house_members_can_view ON house_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR house_id IN (SELECT get_user_house_ids(auth.uid()))
    OR EXISTS (SELECT 1 FROM houses WHERE id = house_members.house_id AND owner_id = auth.uid())
  );

CREATE POLICY house_members_can_insert ON house_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM houses WHERE id = house_members.house_id AND owner_id = auth.uid())
  );

CREATE POLICY house_members_can_update ON house_members
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM houses WHERE id = house_members.house_id AND owner_id = auth.uid())
  );

CREATE POLICY house_members_can_delete ON house_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM houses WHERE id = house_members.house_id AND owner_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: HOUSE_INVITATIONS
-- ============================================
CREATE POLICY house_invitations_can_view ON house_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = house_invitations.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY house_invitations_can_insert_admin ON house_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = house_invitations.house_id
      AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY house_invitations_can_update_member ON house_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = house_invitations.house_id
      AND h.owner_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: EXPENSES
-- ============================================
DROP POLICY IF EXISTS expenses_can_view ON expenses;
DROP POLICY IF EXISTS expenses_can_insert ON expenses;
DROP POLICY IF EXISTS expenses_can_update_admin ON expenses;
DROP POLICY IF EXISTS expenses_can_delete_admin ON expenses;

CREATE POLICY expenses_can_view ON expenses
  FOR SELECT USING (
    house_id IN (SELECT get_user_house_ids(auth.uid()))
    OR EXISTS (SELECT 1 FROM houses WHERE id = expenses.house_id AND owner_id = auth.uid())
  );

CREATE POLICY expenses_can_insert ON expenses
  FOR INSERT WITH CHECK (
    paid_by = auth.uid()
    OR house_id IN (SELECT get_user_house_ids(auth.uid()))
    OR EXISTS (SELECT 1 FROM houses WHERE id = expenses.house_id AND owner_id = auth.uid())
  );

CREATE POLICY expenses_can_update_admin ON expenses
  FOR UPDATE USING (
    paid_by = auth.uid()
    OR EXISTS (SELECT 1 FROM houses WHERE id = expenses.house_id AND owner_id = auth.uid())
  );

CREATE POLICY expenses_can_delete_admin ON expenses
  FOR DELETE USING (
    paid_by = auth.uid()
    OR EXISTS (SELECT 1 FROM houses WHERE id = expenses.house_id AND owner_id = auth.uid())
  );

-- ============================================
-- RLS POLICIES: EXPENSE_SPLITS
-- ============================================
DROP POLICY IF EXISTS expense_splits_can_view ON expense_splits;
DROP POLICY IF EXISTS expense_splits_can_insert ON expense_splits;
DROP POLICY IF EXISTS expense_splits_can_update_admin ON expense_splits;
DROP POLICY IF EXISTS expense_splits_can_delete_admin ON expense_splits;

CREATE POLICY expense_splits_can_view ON expense_splits
  FOR SELECT USING (
    participant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_splits.expense_id AND e.paid_by = auth.uid())
  );

CREATE POLICY expense_splits_can_insert ON expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_splits.expense_id AND e.paid_by = auth.uid())
    OR participant_id = auth.uid()
  );

CREATE POLICY expense_splits_can_update_admin ON expense_splits
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_splits.expense_id AND e.paid_by = auth.uid())
  );

CREATE POLICY expense_splits_can_delete_admin ON expense_splits
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_splits.expense_id AND e.paid_by = auth.uid())
  );

-- ============================================
-- RLS POLICIES: RECURRING_EXPENSES
-- ============================================
CREATE POLICY recurring_expenses_can_view ON recurring_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = recurring_expenses.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY recurring_expenses_can_insert_admin ON recurring_expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = recurring_expenses.house_id
      AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY recurring_expenses_can_update_admin ON recurring_expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = recurring_expenses.house_id
      AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY recurring_expenses_can_delete_admin ON recurring_expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = recurring_expenses.house_id
      AND h.owner_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: DEBTS
DROP POLICY IF EXISTS debts_can_view ON debts;
DROP POLICY IF EXISTS debts_can_insert ON debts;
DROP POLICY IF EXISTS debts_can_update ON debts;
DROP POLICY IF EXISTS debts_can_update_admin ON debts;

CREATE POLICY debts_can_view ON debts
  FOR SELECT USING (
    debtor_id = auth.uid()
    OR creditor_id = auth.uid()
    OR house_id IN (SELECT get_user_house_ids(auth.uid()))
    OR EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = debts.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY debts_can_insert ON debts
  FOR INSERT WITH CHECK (
    creditor_id = auth.uid()
    OR debtor_id = auth.uid()
    OR house_id IN (SELECT get_user_house_ids(auth.uid()))
    OR EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = debts.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY debts_can_update ON debts
  FOR UPDATE USING (
    creditor_id = auth.uid()
    OR debtor_id = auth.uid()
    OR house_id IN (SELECT get_user_house_ids(auth.uid()))
  );

CREATE POLICY debts_can_delete_admin ON debts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = debts.house_id
      AND h.owner_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: PAYMENTS
-- ============================================
CREATE POLICY payments_can_view ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM debts d
      WHERE d.id = payments.debt_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = d.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY payments_can_insert ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM debts d
      WHERE d.id = payments.debt_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = d.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY payments_can_update_admin ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM debts d
      JOIN houses h ON h.id = d.house_id
      WHERE d.id = payments.debt_id
      AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY payments_can_delete_admin ON payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM debts d
      JOIN houses h ON h.id = d.house_id
      WHERE d.id = payments.debt_id
      AND h.owner_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: ASSETS
-- ============================================
CREATE POLICY assets_can_view ON assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = assets.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY assets_can_insert ON assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = assets.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY assets_can_update_admin ON assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = assets.house_id
      AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY assets_can_delete_admin ON assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = assets.house_id
      AND h.owner_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: ASSET_CONTRIBUTIONS
-- ============================================
CREATE POLICY asset_contributions_can_view ON asset_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_contributions.asset_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = a.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY asset_contributions_can_insert ON asset_contributions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_contributions.asset_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = a.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY asset_contributions_can_update_admin ON asset_contributions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_contributions.asset_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = a.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY asset_contributions_can_delete_admin ON asset_contributions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_contributions.asset_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = a.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS POLICIES: ASSET_TRANSFERS
-- ============================================
CREATE POLICY asset_transfers_can_view ON asset_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_transfers.asset_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = a.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY asset_transfers_can_insert ON asset_transfers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_transfers.asset_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = a.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY asset_transfers_can_update_admin ON asset_transfers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_transfers.asset_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = a.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY asset_transfers_can_delete_admin ON asset_transfers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_transfers.asset_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = a.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS POLICIES: ASSET_SALES
-- ============================================
CREATE POLICY asset_sales_can_view ON asset_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_sales.asset_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = a.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY asset_sales_can_insert ON asset_sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_sales.asset_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = a.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY asset_sales_can_update_admin ON asset_sales
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_sales.asset_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = a.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY asset_sales_can_delete_admin ON asset_sales
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_sales.asset_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = a.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS POLICIES: SETTLEMENTS
-- ============================================
CREATE POLICY settlements_can_view ON settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = settlements.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY settlements_can_insert ON settlements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM house_members hm
      WHERE hm.house_id = settlements.house_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY settlements_can_update_admin ON settlements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = settlements.house_id
      AND h.owner_id = auth.uid()
    )
  );

CREATE POLICY settlements_can_delete_admin ON settlements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = settlements.house_id
      AND h.owner_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: SETTLEMENT_TRANSACTIONS
-- ============================================
CREATE POLICY settlement_transactions_can_view ON settlement_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlements s
      WHERE s.id = settlement_transactions.settlement_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = s.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY settlement_transactions_can_insert ON settlement_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM settlements s
      WHERE s.id = settlement_transactions.settlement_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = s.house_id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY settlement_transactions_can_update_admin ON settlement_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM settlements s
      WHERE s.id = settlement_transactions.settlement_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = s.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY settlement_transactions_can_delete_admin ON settlement_transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM settlements s
      WHERE s.id = settlement_transactions.settlement_id
      AND EXISTS (
        SELECT 1 FROM houses h
        WHERE h.id = s.house_id
        AND h.owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- RLS POLICIES: NOTIFICATIONS
-- ============================================
CREATE POLICY notifications_can_view ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_can_insert ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_can_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: NOTIFICATION_PREFERENCES
-- ============================================
CREATE POLICY notification_preferences_can_view ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_can_insert ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY notification_preferences_can_update ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: AUDIT_LOGS
-- ============================================
CREATE POLICY audit_logs_can_view ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM houses h
      WHERE h.id = audit_logs.house_id
      AND EXISTS (
        SELECT 1 FROM house_members hm
        WHERE hm.house_id = h.id
        AND hm.user_id = auth.uid()
        AND hm.status = 'active'
      )
    )
  );

CREATE POLICY audit_logs_can_insert ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp on various tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_houses_updated_at
  BEFORE UPDATE ON houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action := 'CREATE';
  ELSIF TG_OP = 'UPDATE' THEN
    action := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    action := 'DELETE';
  END IF;

  INSERT INTO audit_logs (house_id, user_id, action, resource_type, resource_id, old_value, new_value)
  VALUES (
    NULL, -- house_id will be set by the calling function
    auth.uid(),
    action,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- ============================================
-- SAMPLE DATA (DEMO)
-- ============================================

-- Insert sample houses
-- Note: These will need actual user IDs from Supabase Auth
-- INSERT INTO houses (owner_id, name, description, address)
-- VALUES
--   ('sample-user-id-1', 'Green House', 'A cozy house for students', '123 Main Street, City'),
--   ('sample-user-id-2', 'Blue House', 'Modern apartment near campus', '456 Oak Avenue, City');

-- ============================================
-- END OF MIGRATION
-- ============================================
