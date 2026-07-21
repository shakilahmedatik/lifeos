## Context

LifeOS is a task management app with a dashboard showing current/next tasks and a routine module for timed tasks. The backend uses a modular architecture with ports/adapters pattern, and the frontend uses React with Vite. The dashboard currently shows Now/Next cards and task counts. Vitest is installed for testing.

Adding habits requires a new module following the existing architecture patterns, with dashboard integration for quick logging.

## Goals / Non-Goals

**Goals:**
- Enable users to define recurring habits with flexible frequency rules
- Provide one-tap habit logging from the dashboard
- Track streaks to motivate consistency
- Deliver weekly insights on habit performance
- Integrate seamlessly with existing dashboard UI

**Non-Goals:**
- Habit templates or social features
- Complex analytics beyond weekly review
- Mobile-native push notifications (future consideration)
- Habit scheduling with time slots (habits are day-level)

## Decisions

### 1. Data Model: Separate habits and habit_logs tables

**Decision**: Use two collections—`habits` for definitions and `habit_logs` for completions.

**Rationale**: Separates concerns (definition vs. tracking), enables efficient queries for streak calculation, and follows the existing pattern where `routine` has tasks and we could extend with logs later.

**Alternatives considered**:
- Single embedded document: Simpler but poor query performance for streak calculations
- Event sourcing: Overkill for this use case

### 2. Streak Calculation: Application-level, not database

**Decision**: Calculate streaks in the application layer when fetching habit stats.

**Rationale**: Streak rules are complex (timezone handling, skipped days, weekly targets), making database-level calculation fragile. Application code is more maintainable and testable.

**Alternatives considered**:
- Database computed columns: Limited flexibility for custom rules
- Cached materialized view: Adds complexity for minimal benefit at current scale

### 3. Dashboard Integration: Extend existing summary endpoint

**Decision**: Add `dueHabits` array to the existing `GET /api/dashboard/summary` response.

**Rationale**: Keeps a single dashboard fetch call, follows the existing API pattern, and avoids waterfall requests.

**Alternatives considered**:
- Separate `/api/habits/today` endpoint: Would require parallel fetching on frontend
- GraphQL: Architectural change not justified for this feature

### 4. Quick-Log chips: Optimistic UI with immediate feedback

**Decision**: When user taps a habit chip, immediately update UI, then persist to backend.

**Rationale**: Tapping a chip should feel instant. If the backend call fails, show a toast and revert.

**Alternatives considered**:
- Wait for server response: Feels sluggish for a frequent action
- Offline-first with sync: Scope creep for v1

## Risks / Trade-offs

- **Streak accuracy on timezone changes** → Store all dates as ISO strings in user's local timezone; document limitation
- **Dashboard payload growth** → Limit dueHabits to 8 items; paginate if needed later
- **Weekly review performance** → Cache weekly stats; recalculate on habit_log changes
- **Habit frequency complexity** → Start with daily/weekly; add custom cron patterns in v2
