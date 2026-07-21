## ADDED Requirements

### Requirement: Create a timed task
The system SHALL allow creating a task with a title, category, date, start time, end time, and optional notes and reminder settings.

#### Scenario: Successful task creation
- **WHEN** a user creates a task with valid `startTime < endTime`
- **THEN** the task is persisted with status `planned` and returned with its generated ID

#### Scenario: Overlap detection as warning
- **WHEN** a user creates a task that overlaps with an existing task on the same date
- **THEN** the new task is still created but the response includes `overlapsWith` containing the conflicting tasks

#### Scenario: Invalid time range rejected
- **WHEN** a user creates a task with `startTime >= endTime`
- **THEN** the system returns a validation error and the task is not created

### Requirement: Get day schedule
The system SHALL return all tasks for a given date, ordered by start time.

#### Scenario: Retrieve tasks for a date
- **WHEN** a user requests the schedule for `2026-07-22`
- **THEN** all tasks with `date = '2026-07-22'` are returned sorted by `startTime`

#### Scenario: Empty day returns empty array
- **WHEN** a user requests the schedule for a date with no tasks
- **THEN** an empty array is returned

### Requirement: Update task status
The system SHALL allow changing a task's status among `planned`, `in_progress`, `done`, and `skipped`.

#### Scenario: Mark task as done
- **WHEN** a user sets a task's status to `done`
- **THEN** the task's `status` is updated and `updatedAt` is refreshed

### Requirement: Update task details
The system SHALL allow patching a task's title, category, times, notes, and reminder settings.

#### Scenario: Partial update
- **WHEN** a user updates only the `title` of a task
- **THEN** only the title changes; all other fields remain unchanged

### Requirement: Delete a task
The system SHALL allow permanently removing a task.

#### Scenario: Successful deletion
- **WHEN** a user deletes an existing task
- **THEN** the task is removed from storage and a 204 response is returned

### Requirement: Task categories
Tasks SHALL support the following categories: `work`, `workout`, `learning`, `habit`, `personal`, `general`.

#### Scenario: Default category
- **WHEN** a task is created without specifying a category
- **THEN** the category defaults to `general`

### Requirement: Duration calculation
The system SHALL compute task duration in minutes from start and end times.

#### Scenario: One-hour task
- **WHEN** a task starts at `09:00` and ends at `10:00`
- **THEN** `durationMinutes(task)` returns 60
