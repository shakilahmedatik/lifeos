## Purpose

The notifications module provides per-task reminder functionality with sound alerts delivered via Server-Sent Events (SSE). This module addresses the lateness/meeting-prep problem by enabling users to set reminders for tasks with configurable timing and sound types.

## Requirements

### Requirement: Task reminder creation
The system SHALL allow users to create reminders for tasks with configurable timing (e.g., 5 minutes before, 1 hour before, at scheduled time).

#### Scenario: Creating a reminder for a task
- **WHEN** user selects a task and sets a reminder time
- **THEN** system stores the reminder and schedules it for delivery

### Requirement: Real-time notification delivery
The system SHALL deliver notifications to users in real-time via Server-Sent Events (SSE) when reminder time is reached.

#### Scenario: Notification delivery via SSE
- **WHEN** scheduled reminder time is reached
- **THEN** system sends notification to connected client via SSE stream

### Requirement: Sound alert playback
The system SHALL play an audible sound when a notification is delivered, using browser-native Web Audio API.

#### Scenario: Sound playback on notification
- **WHEN** notification is received by client
- **THEN** system plays appropriate notification sound

### Requirement: Notification management
The system SHALL allow users to view, edit, and delete scheduled reminders.

#### Scenario: Viewing scheduled reminders
- **WHEN** user navigates to notifications panel
- **THEN** system displays list of all scheduled reminders with task details and timing

#### Scenario: Editing a reminder
- **WHEN** user modifies reminder time for a task
- **THEN** system updates the scheduled reminder with new timing

#### Scenario: Deleting a reminder
- **WHEN** user deletes a reminder
- **THEN** system removes the scheduled reminder from the queue

### Requirement: Notification persistence
The system SHALL persist notifications in the database to survive server restarts and maintain state across sessions.

#### Scenario: Server restart recovery
- **WHEN** server restarts
- **THEN** system reloads all scheduled notifications from database

### Requirement: Sound preset selection
The system SHALL provide multiple notification sound presets that users can choose from.

#### Scenario: Changing notification sound
- **WHEN** user selects a different sound preset in settings
- **THEN** system uses selected sound for all subsequent notifications
