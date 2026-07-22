## Context

LifeOS is a local-only personal dashboard with a modular backend architecture (domain → application → ports → adapters → api). The Finance module is Phase 4 of the roadmap. Previous phases (Routine, Habits, Notifications, Workout) have established clear patterns for module structure, SQLite migrations, and API routing.

The spec defines three core tables: `accounts`, `categories`, and `transactions` with integer minor units for money (e.g., 12550 = ৳125.50). Currency is fixed to BDT. The module must be fully manual (no bank integration).

## Goals / Non-Goals

**Goals:**
- Implement manual ledger for income/expense tracking
- Support multiple account types (cash, bank, card, savings)
- Provide category-based transaction organization
- Display monthly income/expense summaries with category breakdowns
- Show running balance per account
- Follow existing module architecture patterns
- Resolve the 5 accounting decisions from the spec (§7.4)

**Non-Goals:**
- Bank integration or Plaid connectivity
- Budget-vs-actual comparisons (deferred to later)
- Multi-currency support (BDT only)
- Charts or advanced visualizations (Phase 6 stretch)
- Transfer transactions between accounts (can be added later)

## Decisions

### 1. Account Transfers: Two Linked Entries

**Decision:** Represent transfers as two separate transactions (one income, one expense) with a `transfer_pair_id` field linking them.

**Rationale:** Simple approach that doesn't require a separate transfer table. The linked entries maintain audit trail while keeping the transaction model unified. Alternative considered: separate transfer table — rejected as over-engineering for a personal ledger.

### 2. Credit Card Payments: Two Linked Entries

**Decision:** Credit card payments are two linked entries — expense from bank account, income to card account (reduces card balance).

**Rationale:** Matches real-world flow. When you pay a credit card bill, money leaves your bank and "enters" the card account (reducing what you owe). This keeps account balances accurate.

### 3. Starting Balances: Opening Balance Transactions

**Decision:** Store starting balances as opening-balance transactions dated at account creation.

**Rationale:** Consistent with transaction-based history. Running balance calculations naturally include opening balances. Alternative considered: account metadata — rejected because it complicates balance queries and breaks the "balance = sum of transactions" mental model.

### 4. Category Archiving: Soft Delete with Historical Preservation

**Decision:** Categories can be archived (soft delete) but never hard deleted. Archived categories remain in historical reports.

**Rationale:** Transactions reference categories by ID. Archiving prevents new transactions while preserving historical data integrity. This is simpler than cascading updates or null references.

### 5. Transaction Editing: Allow with Audit Trail

**Decision:** Transactions can be edited or deleted after affecting previous months. No locking机制.

**Rationale:** Personal ledger — user needs flexibility to correct mistakes. Monthly totals will recalculate automatically. Adding an audit trail later is possible but not required for v1. This matches the "simple ledger" philosophy.

### 6. Module Architecture: Follow Existing Patterns

**Decision:** Use the same structure as other modules:
- `domain/types.ts` — Account, Category, Transaction types
- `ports/` — Repository interfaces
- `adapters/sqlite/` — SQLite implementations
- `application/` — Use case services (AccountService, CategoryService, TransactionService, FinanceReportService)
- `api/router.ts` — Express routes

**Rationale:** Consistency with existing codebase reduces cognitive load and maintenance burden.

### 7. Dashboard Integration: Monthly Summary Widget

**Decision:** Add a finance widget to the dashboard showing current month's income, expense, and net total.

**Rationale:** Keeps finance visible without requiring navigation. Follows the "glanceable metric" principle from the spec.

## Risks / Trade-offs

- **Risk:** Allowing transaction edits without audit trail could lead to data trust issues → **Mitigation:** Add optional edit history in future iteration if needed
- **Risk:** Opening balance transactions could be confused with real transactions → **Mitigation:** Use a special category type `opening_balance` to distinguish them
- **Risk:** Transfer linking adds complexity to balance calculations → **Mitigation:** Balance queries sum all transactions; transfer pairs are only needed for display purposes

## Migration Plan

1. Add new migration file `004_create_finance.sql` with accounts, categories, transactions tables
2. Insert default categories (Salary, Food, Transport, etc.)
3. Wire up Finance module in composition root (`index.ts`)
4. Add API routes under `/api/finance/`
5. Add frontend finance module
6. Add dashboard finance widget

## Open Questions

- Should we support recurring transactions (monthly salary, rent)? → Defer to Phase 5+
- Do we need transaction search/filter? → Basic date range filter in v1, full search later
