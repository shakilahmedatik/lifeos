## ADDED Requirements

### Requirement: Account creation
The system SHALL allow users to create accounts with a name and type (cash, bank, card, savings).

#### Scenario: Create a bank account
- **WHEN** user provides name "Main Bank" and type "bank"
- **THEN** system creates account with generated ID, name "Main Bank", type "bank"

### Requirement: Account listing
The system SHALL list all accounts with their current balance.

#### Scenario: List accounts with balances
- **WHEN** user requests account list
- **THEN** system returns all accounts with their running balance calculated from transactions

### Requirement: Account types
The system SHALL support exactly four account types: cash, bank, card, savings.

#### Scenario: Invalid account type rejected
- **WHEN** user tries to create account with type "crypto"
- **THEN** system rejects the request with validation error

### Requirement: Account balance calculation
The system SHALL calculate account balance as sum of all transactions (income adds, expense subtracts) plus opening balance transaction.

#### Scenario: Balance includes opening balance
- **WHEN** account has opening balance transaction of 100000 (৳1,000.00) and expense transaction of 5000 (৳50.00)
- **THEN** account balance is 95000 (৳950.00)

### Requirement: Account archiving
The system SHALL allow users to archive accounts without deleting historical transactions.

#### Scenario: Archive an account
- **WHEN** user archives account "Old Wallet"
- **THEN** account is marked archived and excluded from new transaction selection, but historical transactions remain
