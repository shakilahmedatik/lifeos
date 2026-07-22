## Why

LifeOS needs a Finance module to complete the core daily loop (plan → do → review → improve). Users need to track income and expenses manually in a simple ledger, view monthly summaries, and understand category breakdowns. This is Phase 4 of the roadmap, scheduled after backup/export functionality is implemented to protect valuable financial history.

## What Changes

- Add manual ledger for recording income and expense transactions
- Support multiple account types (cash, bank, card, savings)
- Provide category-based organization (income vs expense categories)
- Display monthly income/expense summaries with category breakdowns
- Show running balance per account
- Use integer minor units for all monetary amounts (e.g., 12550 = ৳125.50) to avoid floating-point precision errors
- Currency fixed to BDT (Bangladeshi Taka)

## Capabilities

### New Capabilities

- `finance-accounts`: Account management — create, list, and manage cash/bank/card/savings accounts
- `finance-categories`: Category management — organize transactions by income/expense categories
- `finance-transactions`: Transaction recording — add, edit, delete transactions with integer minor unit amounts
- `finance-reports`: Monthly summaries — income/expense totals, category breakdowns, running account balances

### Modified Capabilities

- `dashboard`: Add finance widget showing current month's income/expense summary

## Impact

- **Backend modules**: New `finance/` module following existing architecture (domain → application → ports → adapters → api)
- **Database**: New migration for `accounts`, `categories`, and `transactions` tables
- **Frontend**: New `finance/` module with transaction list, monthly view, and category breakdown
- **Dashboard**: New finance summary widget
- **Contracts**: New shared TypeScript types for finance APIs
- **Dependencies**: No new external dependencies — uses existing SQLite and Express patterns
