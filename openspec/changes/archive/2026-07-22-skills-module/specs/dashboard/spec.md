## MODIFIED Requirements

### Requirement: Dashboard displays habit statistics
The system SHALL display habit statistics on the dashboard including streaks and completion rates.

#### Scenario: Dashboard shows habit stats
- **WHEN** user views the dashboard
- **THEN** system displays habit statistics with current streaks and completion percentages

#### Scenario: Dashboard loads with no habits
- **WHEN** user has no habits configured
- **THEN** system shows message to create first habit

## ADDED Requirements

### Requirement: Dashboard displays learning statistics
The system SHALL display learning statistics widget showing recent sessions and overall progress.

#### Scenario: Learning widget shows recent sessions
- **WHEN** user views the dashboard
- **THEN** system displays last 5 learning sessions with date, duration, and skill category

#### Scenario: Learning widget shows progress summary
- **WHEN** user views the dashboard
- **THEN** system displays total learning hours, active courses count, and categories used

#### Scenario: Learning widget empty state
- **WHEN** user has no learning sessions
- **THEN** system shows message to log first learning session

#### Scenario: Learning widget navigation
- **WHEN** user clicks on learning widget
- **THEN** system navigates to full learning sessions view