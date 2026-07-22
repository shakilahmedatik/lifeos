## ADDED Requirements

### Requirement: Category creation
The system SHALL allow users to create categories with a name and kind (income or expense).

#### Scenario: Create an expense category
- **WHEN** user provides name "Food" and kind "expense"
- **THEN** system creates category with generated ID, name "Food", kind "expense"

### Requirement: Category listing
The system SHALL list all categories filtered by kind.

#### Scenario: List expense categories
- **WHEN** user requests expense categories
- **THEN** system returns all categories where kind is "expense"

### Requirement: Default categories
The system SHALL provide default categories on first run: Salary (income), Food (expense), Transport (expense), Shopping (expense), Bills (expense), Entertainment (expense).

#### Scenario: Default categories exist
- **WHEN** system initializes finance module
- **THEN** default categories are created if they don't exist

### Requirement: Category archiving
The system SHALL allow users to archive categories without deleting historical transactions.

#### Scenario: Archive a category
- **WHEN** user archives category "Old Subscription"
- **THEN** category is marked archived and excluded from new transaction selection, but historical transactions remain

### Requirement: Category validation
The system SHALL reject transactions referencing non-existent or archived categories.

#### Scenario: Transaction with invalid category rejected
- **WHEN** user tries to create transaction with category_id that doesn't exist
- **THEN** system rejects the request with validation error
