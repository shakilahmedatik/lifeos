## ADDED Requirements

### Requirement: Log a habit completion
The system SHALL record a habit completion for a given date when triggered by the user.

#### Scenario: Successful log
- **WHEN** a user logs a habit for today
- **THEN** a habit_log entry is created with the current timestamp and the habit's completion count increments

#### Scenario: Already logged today
- **WHEN** a user attempts to log a habit that is already logged for today
- **THEN** the system returns the existing log entry (idempotent operation)

### Requirement: Unlog a habit completion
The system SHALL allow removing a habit log entry for a given date.

#### Scenario: Successful unlog
- **WHEN** a user removes a habit log for today
- **THEN** the habit_log entry is deleted and the completion count decrements

### Requirement: Get today's due habits
The system SHALL return all habits due today with their log status.

#### Scenario: Habits with logs
- **WHEN** a user requests today's due habits and some are already logged
- **THEN** each habit includes `logged: true` and the `logId` for that entry

#### Scenario: Habits without logs
- **WHEN** a user requests today's due habits and none are logged
- **THEN** each habit includes `logged: false`

### Requirement: Batch log multiple habits
The system SHALL allow logging multiple habits in a single request.

#### Scenario: Batch log success
- **WHEN** a user submits an array of habit IDs to log
- **THEN** all specified habits are logged for today and the response includes the created logs
