## ADDED Requirements

### Requirement: Calculate current streak
The system SHALL calculate the current consecutive completion streak for each habit based on its frequency.

#### Scenario: Daily habit streak
- **WHEN** a user has a daily habit logged for the last 5 consecutive days
- **THEN** the `currentStreak` is 5

#### Scenario: Streak broken by gap
- **WHEN** a user has a daily habit with a gap of 2 days
- **THEN** the `currentStreak` counts only from the most recent consecutive run

#### Scenario: Weekly habit streak
- **WHEN** a user has a weekly habit logged every week for 3 weeks
- **THEN** the `currentStreak` is 3

### Requirement: Calculate longest streak
The system SHALL track and return the all-time longest streak for each habit.

#### Scenario: Longest streak returned
- **WHEN** a user's habit has a longest streak of 14 days
- **THEN** the `longestStreak` field is 14 regardless of current streak

### Requirement: Streak includes today
The system SHALL count today in the streak only if the habit is logged for today.

#### Scenario: Today not yet logged
- **WHEN** a user's daily habit is not yet logged today but was logged the previous N days
- **THEN** the `currentStreak` is N (today does not count)

#### Scenario: Today logged
- **WHEN** a user's daily habit is logged today and was logged the previous N days
- **THEN** the `currentStreak` is N+1

### Requirement: Get habit stats
The system SHALL return streak and completion stats for a given habit over a date range.

#### Scenario: Stats for last 30 days
- **WHEN** a user requests stats for a habit over the last 30 days
- **THEN** the response includes `completionRate`, `currentStreak`, `longestStreak`, and `totalCompletions`
