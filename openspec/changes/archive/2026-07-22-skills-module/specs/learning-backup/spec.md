## ADDED Requirements

### Requirement: Export learning data
The system SHALL allow users to export all learning data in JSON format.

#### Scenario: Successful export
- **WHEN** user requests data export
- **THEN** system generates JSON file with all sessions, courses, categories, and metadata

#### Scenario: Export includes metadata
- **WHEN** system generates export file
- **THEN** file includes export timestamp, data version, and schema information

### Requirement: Import learning data
The system SHALL allow users to import learning data from JSON backup.

#### Scenario: Successful import
- **WHEN** user selects valid JSON backup file
- **THEN** system imports data and merges with existing data (or replaces based on user choice)

#### Scenario: Invalid file format
- **WHEN** user selects invalid file format
- **THEN** system shows error message and prevents import

### Requirement: Backup reminders
The system SHALL remind users to backup data periodically.

#### Scenario: Backup reminder after sessions
- **WHEN** user completes 10 learning sessions without backup
- **THEN** system shows gentle reminder to backup data

#### Scenario: Backup reminder on app open
- **WHEN** user opens app and last backup was more than 7 days ago
- **THEN** system shows backup reminder notification