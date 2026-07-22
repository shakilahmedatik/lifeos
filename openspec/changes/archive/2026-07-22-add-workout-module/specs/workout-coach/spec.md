## ADDED Requirements

### Requirement: User can start workout session
The system SHALL allow users to start a workout session from a scheduled or ad-hoc workout.

#### Scenario: Start workout session
- **WHEN** user selects a workout to start
- **THEN** system creates a new workout session and enters coach mode

### Requirement: Coach mode displays exercise instructions
The system SHALL display current exercise details including name, sets, reps, and weight in coach mode.

#### Scenario: Display current exercise
- **WHEN** user is in coach mode for a workout session
- **THEN** system shows the current exercise with all relevant details

### Requirement: Coach mode provides timers for sets
The system SHALL provide timers for tracking set duration during exercises.

#### Scenario: Start set timer
- **WHEN** user starts a set
- **THEN** system starts a timer counting up to track set duration

### Requirement: Coach mode provides rest timers between sets
The system SHALL provide configurable rest timers between sets.

#### Scenario: Start rest timer
- **WHEN** user completes a set
- **THEN** system starts a rest timer counting down from configured rest period

### Requirement: Coach mode plays sound alerts
The system SHALL play sound alerts when timers complete or transitions occur.

#### Scenario: Sound alert on timer completion
- **WHEN** a timer reaches zero or set duration
- **THEN** system plays a sound alert to notify the user

### Requirement: Coach mode displays video references
The system SHALL display video reference links for exercises when available.

#### Scenario: Show video reference
- **WHEN** user is viewing an exercise with a video reference
- **THEN** system displays a clickable link to the video

### Requirement: Coach mode tracks actual performance
The system SHALL allow users to log actual sets, reps, and weight performed.

#### Scenario: Log completed set
- **WHEN** user completes a set
- **THEN** system records the actual reps and weight performed

### Requirement: User can complete workout session
The system SHALL allow users to finish and save a workout session.

#### Scenario: Complete workout
- **WHEN** user finishes all exercises or chooses to end early
- **THEN** system saves the workout session with all logged performance data