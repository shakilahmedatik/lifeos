## ADDED Requirements

### Requirement: Get weekly habit summary
The system SHALL return a summary of all habits for the current week (Monday–Sunday).

#### Scenario: Weekly summary response
- **WHEN** a user requests the weekly habit summary
- **THEN** the response includes each habit with its completion count, target, and weekly completion rate

### Requirement: Weekly trend data
The system SHALL provide day-by-day completion data for the current week.

#### Scenario: Daily breakdown
- **WHEN** a user requests the weekly summary
- **THEN** the response includes a `dailyBreakdown` array with 7 entries (Mon–Sun) showing completions per day

### Requirement: Highlight top performers
The system SHALL identify habits with the highest completion rate for the week.

#### Scenario: Top habits returned
- **WHEN** a user requests the weekly summary
- **THEN** the response includes a `topHabits` array of the top 3 habits by completion rate

### Requirement: Weekly completion rate
The system SHALL calculate the overall completion rate across all habits for the week.

#### Scenario: Overall rate calculated
- **WHEN** a user has 5 habits with targets of 7 completions each
- **THEN** the `overallCompletionRate` is total completions divided by total possible completions (35)
