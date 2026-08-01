CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'card', 'savings', 'mfs')),
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  note TEXT,
  transfer_pair_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_archived ON accounts(archived);
CREATE INDEX IF NOT EXISTS idx_categories_kind ON categories(kind);
CREATE INDEX IF NOT EXISTS idx_categories_archived ON categories(archived);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_pair_id ON transactions(transfer_pair_id);

-- Default categories
INSERT OR IGNORE INTO categories (id, name, kind) VALUES
  ('cat-income-salary', 'Salary', 'income'),
  ('cat-income-freelance', 'Freelance', 'income'),
  ('cat-income-other', 'Other Income', 'income'),
  ('cat-expense-food', 'Food', 'expense'),
  ('cat-expense-transport', 'Transport', 'expense'),
  ('cat-expense-shopping', 'Shopping', 'expense'),
  ('cat-expense-bills', 'Bills', 'expense'),
  ('cat-expense-entertainment', 'Entertainment', 'expense'),
  ('cat-expense-health', 'Health', 'expense'),
  ('cat-expense-education', 'Education', 'expense'),
  ('cat-expense-other', 'Other Expense', 'expense'),
  ('cat-opening-balance', 'Opening Balance', 'income');
