## Why

The LifeOS app currently tracks scheduled tasks but lacks support for recurring habits—a core productivity pattern. Users need to track daily/weekly habits (exercise, reading, meditation) with quick logging from the dashboard, visualize streaks for motivation, and review weekly habit performance. This closes the gap between task scheduling and behavioral consistency.

## What Changes

- Add habit definition CRUD (name, frequency, target count, category)
- Add quick-log chips on the dashboard for one-tap habit completion
- Implement streak tracking with current/longest streak per habit
- Add weekly habit review widget showing completion rates and trends
- Create backend API endpoints for habit CRUD, logging, and stats
- Integrate habit data into the dashboard summary API

## Capabilities

### New Capabilities

- `habit-management`: Define, edit, and delete habits with frequency rules (daily, weekly, custom)
- `habit-logging`: Quick-log habit completions from dashboard chips or habit detail view
- `habit-streaks`: Track current and longest streaks per habit with streak preservation rules
- `habit-weekly-review`: Weekly summary widget with completion rates, trends, and streak highlights

### Modified Capabilities

- `dashboard`: Extend summary API to include today's due habits and quick-log chip data

## Impact

- **Frontend**: New `habits/` module with components (HabitChip, StreakBadge, WeeklyReviewWidget); dashboard modified to render habit chips
- **Backend**: New `habits/` module with API routes, application services, and storage adapters
- **Data**: New habits and habit_logs collections/tables
- **Dependencies**: Vitest already installed; no new dependencies required
