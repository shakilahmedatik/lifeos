## ADDED Requirements

### Requirement: Transaction creation
The system SHALL allow users to create transactions with account, category, date, amount (integer minor units), and optional note.

#### Scenario: Create an expense transaction
- **WHEN** user provides account_id, category_id, date "2026-07-22", amount_minor 5000, note "Lunch"
- **THEN** system creates transaction with generated ID and all provided fields

### Requirement: Integer minor units
The system SHALL store all monetary amounts as integers representing minor units (12550 = ৳125.50).

#### Scenario: Amount stored as integer
- **WHEN** user enters amount 125.50
- **THEN** system stores 12550 in amount_minor field

### Requirement: Currency fixed to BDT
The system SHALL use BDT as the only supported currency.

#### Scenario: Currency defaults to BDT
- **WHEN** user creates transaction without specifying currency
- **THEN** transaction currency is "BDT"

### Requirement: Transaction editing
The system SHALL allow users to edit existing transactions.

#### Scenario: Edit transaction amount
- **WHEN** user updates transaction amount from 5000 to 7500
- **THEN** transaction amount_minor is updated to 7500

### Requirement: Transaction deletion
The system SHALL allow users to delete transactions.

#### Scenario: Delete a transaction
- **WHEN** user deletes transaction
- **THEN** transaction is removed from database

### Requirement: Transaction listing by date range
The system SHALL list transactions filtered by date range.

#### Scenario: List transactions for July 2026
- **WHEN** user requests transactions from "2026-07-01" to "2026-07-31"
- **THEN** system returns all transactions within that date range

### Requirement: Transfer transactions
The system SHALL support transfers between accounts as two linked transactions.

#### Scenario: Transfer between accounts
- **WHEN** user transfers 100000 (৳1,000.00) from "Bank" to "Cash"
- **THEN** system creates expense transaction on "Bank" and income transaction on "Cash" with matching transfer_pair_id

### Requirement: Opening balance transactions
The system SHALL support opening balance transactions to set initial account balances.

#### Scenario: Set opening balance
- **WHEN** user creates opening balance transaction for account "Bank" with amount 500000 (৳5,000.00)
- **THEN** transaction is created with special category type "opening_balance" and included in balance calculation
