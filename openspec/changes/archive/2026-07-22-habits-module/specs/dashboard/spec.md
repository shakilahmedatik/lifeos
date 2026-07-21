## MODIFIED Requirements

### Requirement: Now and next summary
The dashboard SHALL return the current task, next task, today's completion counts, and today's due habits.

#### Scenario: Active task exists
- **WHEN** a task's time range contains the current time
- **THEN** that task is returned as `now`

#### Scenario: No active task
- **WHEN** no task's time range contains the current time
- **THEN** `now` is `null`

#### Scenario: Next task after current
- **WHEN** there is a task starting after the current time
- **THEN** the earliest such task is returned as `next`

#### Scenario: No upcoming tasks
- **WHEN** no tasks start after the current time
- **THEN** `next` is `null`

#### Scenario: Today's counts
- **WHEN** the dashboard summary is requested
- **THEN** `todayCount` is the total tasks for today and `todayDoneCount` is the count of tasks with status `done`

#### Scenario: Due habits included
- **WHEN** the dashboard summary is requested
- **THEN** `dueHabits` is an array of today's due habits with `id`, `name`, `logged`, and `category` fields, limited to 8 items
