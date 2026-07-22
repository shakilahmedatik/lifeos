## Purpose

Finance module reporting for monthly summaries, category breakdowns, and account balances.

## Requirements

### Requirement: Monthly income/expense summary
The system SHALL provide monthly summary showing total income, total expense, and net (income - expense).

#### Scenario: Get July 2026 summary
- **WHEN** user requests summary for "2026-07"
- **THEN** system returns total income, total expense, and net amount for that month

### Requirement: Category breakdown
The system SHALL provide breakdown of expenses by category for a given month.

#### Scenario: Get expense breakdown
- **WHEN** user requests expense breakdown for "2026-07"
- **THEN** system returns list of categories with their total amounts

### Requirement: Account balance summary
The system SHALL provide current balance for each account.

#### Scenario: Get all account balances
- **WHEN** user requests account balances
- **THEN** system returns each account with its current balance

### Requirement: Monthly transaction list
The system SHALL list all transactions for a given month sorted by date.

#### Scenario: List July transactions
- **WHEN** user requests transactions for "2026-07"
- **THEN** system returns all transactions for that month sorted by date ascending
