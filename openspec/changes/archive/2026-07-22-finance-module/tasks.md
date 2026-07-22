## 1. Database Migration

- [x] 1.1 Create migration file `004_create_finance.sql` with accounts, categories, transactions tables
- [x] 1.2 Add default categories (Salary, Food, Transport, Shopping, Bills, Entertainment)
- [x] 1.3 Test migration runs successfully on fresh database

## 2. Backend Domain Types

- [x] 2.1 Create `backend/src/modules/finance/domain/types.ts` with Account, Category, Transaction interfaces
- [x] 2.2 Define AccountType, CategoryKind, TransactionInput types
- [x] 2.3 Add validation rules for integer minor units and BDT currency

## 3. Backend Ports (Repository Interfaces)

- [x] 3.1 Create `backend/src/modules/finance/ports/account-repository.ts`
- [x] 3.2 Create `backend/src/modules/finance/ports/category-repository.ts`
- [x] 3.3 Create `backend/src/modules/finance/ports/transaction-repository.ts`

## 4. Backend SQLite Adapters

- [x] 4.1 Create `backend/src/modules/finance/adapters/sqlite/sqlite-account-repository.ts`
- [x] 4.2 Create `backend/src/modules/finance/adapters/sqlite/sqlite-category-repository.ts`
- [x] 4.3 Create `backend/src/modules/finance/adapters/sqlite/sqlite-transaction-repository.ts`
- [x] 4.4 Implement balance calculation with opening balance support

## 5. Backend Application Services

- [x] 5.1 Create `backend/src/modules/finance/application/account-service.ts`
- [x] 5.2 Create `backend/src/modules/finance/application/category-service.ts`
- [x] 5.3 Create `backend/src/modules/finance/application/transaction-service.ts`
- [x] 5.4 Create `backend/src/modules/finance/application/finance-report-service.ts`
- [x] 5.5 Implement transfer transaction linking logic

## 6. Backend API Routes

- [x] 6.1 Create `backend/src/modules/finance/api/router.ts` with Express routes
- [x] 6.2 Add account CRUD endpoints (GET /accounts, POST /accounts, etc.)
- [x] 6.3 Add category CRUD endpoints (GET /categories, POST /categories, etc.)
- [x] 6.4 Add transaction CRUD endpoints (GET /transactions, POST /transactions, etc.)
- [x] 6.5 Add finance report endpoints (GET /finance/monthly/:yearMonth, etc.)

## 7. Composition Root Integration

- [x] 7.1 Import and wire Finance module in `backend/src/index.ts`
- [x] 7.2 Register finance routes under `/api/finance/`
- [x] 7.3 Verify all endpoints work with existing health check

## 8. Shared Contracts

- [x] 8.1 Create `packages/contracts/finance.ts` with API DTOs
- [x] 8.2 Export finance types from `packages/contracts/index.ts`

## 9. Frontend Finance Module

- [x] 9.1 Create `frontend/src/modules/finance/` directory structure
- [x] 9.2 Create finance API client functions
- [x] 9.3 Create AccountList component
- [x] 9.4 Create CategoryList component
- [x] 9.5 Create TransactionForm component (add/edit)
- [x] 9.6 Create TransactionList component with date filtering
- [x] 9.7 Create MonthlyView component with summary and breakdown

## 10. Dashboard Integration

- [x] 10.1 Create FinanceWidget component for dashboard
- [x] 10.2 Add finance widget to dashboard layout
- [x] 10.3 Fetch and display current month income/expense/net

## 11. Testing

- [x] 11.1 Write unit tests for AccountService
- [x] 11.2 Write unit tests for TransactionService
- [x] 11.3 Write unit tests for FinanceReportService
- [x] 11.4 Write integration tests for SQLite repositories
- [x] 11.5 Write API route tests for finance endpoints

## 12. Validation & Polish

- [x] 12.1 Test full flow: create account → add transaction → view monthly report
- [x] 12.2 Verify running balance calculations are accurate
- [x] 12.3 Test transfer transactions between accounts
- [x] 12.4 Test category archiving preserves historical data
