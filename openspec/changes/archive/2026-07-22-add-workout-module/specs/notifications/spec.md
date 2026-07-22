## ADDED Requirements

### Requirement: Workout timer alert delivery
The system SHALL deliver timer alerts for workout coach mode via Server-Sent Events (SSE) with sound playback.

#### Scenario: Workout timer alert via SSE
- **WHEN** workout timer reaches zero or set duration
- **THEN** system sends workout timer alert to connected client via SSE stream

#### Scenario: Sound playback on workout timer alert
- **WHEN** workout timer alert is received by client
- **THEN** system plays appropriate notification sound for workout timer

### Requirement: Workout timer configuration
The system SHALL allow users to configure sound types for workout timer alerts (set completion, rest period, workout complete).

#### Scenario: Configure workout timer sounds
- **WHEN** user selects sound type for workout timer alerts
- **THEN** system uses selected sound for workout timer alerts