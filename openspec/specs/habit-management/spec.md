## ADDED Requirements

### Requirement: Create a habit definition
The system SHALL allow creating a habit with a name, frequency (daily/weekly), target count, and optional category.

#### Scenario: Successful habit creation
- **WHEN** a user creates a habit with valid name and frequency
- **THEN** the habit is persisted with `createdAt` timestamp and returned with its generated ID

#### Scenario: Duplicate name rejected
- **WHEN** a user creates a habit with a name that already exists
- **THEN** the system returns a 409 conflict error and the habit is not created

### Requirement: List all habits
The system SHALL return all habits for the authenticated user, ordered by creation date.

#### Scenario: Retrieve habits list
- **WHEN** a user requests their habits
- **THEN** all habits are returned with their current streak data

#### Scenario: Empty list
- **WHEN** a user has no habits
- **THEN** an empty array is returned

### Requirement: Update a habit
The system SHALL allow updating a habit's name, frequency, target count, and category.

#### Scenario: Partial update
- **WHEN** a user updates only the `name` of a habit
- **THEN** only the name changes; all other fields remain unchanged

### Requirement: Delete a habit
The system SHALL allow permanently removing a habit and all its logs.

#### Scenario: Successful deletion
- **WHEN** a user deletes an existing habit
- **THEN** the habit and all associated habit_logs are removed and a 204 response is returned
