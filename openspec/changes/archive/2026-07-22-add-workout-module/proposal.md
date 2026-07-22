## Why

The LifeOS system currently handles daily planning (routine), habit tracking, and notifications, but lacks a structured fitness component. Users need a way to plan workouts, execute them with guided timing, and track their fitness history over time. This is Phase 2 of the feature roadmap, building on the notification system's timer infrastructure for coach mode alerts.

## What Changes

- Add workout planning capability with exercise selection and scheduling
- Implement coach mode with real-time timers for sets and rest periods
- Include video reference links for exercise form guidance
- Track workout history with completed sessions and performance metrics
- Add dashboard widget for workout statistics and upcoming sessions
- Reuse notification system's sound-alert infrastructure for timer alerts

## Capabilities

### New Capabilities
- `workout-planning`: Create and manage workout routines with exercises, sets, reps, and scheduling
- `workout-coach`: Real-time workout execution with timers, video references, and guided transitions
- `workout-history`: Track completed workouts, performance metrics, and progress over time

### Modified Capabilities
- `notifications`: Extend timer/alert system to support workout coach mode alerts (requires sound alerts for set completion and rest periods)

## Impact

- Backend: New workout domain module (domain → application → ports → sqlite adapter → api routes)
- Frontend: New workout module with planner view, coach mode interface, and history dashboard
- Database: New tables for workouts, exercises, workout sessions, and exercise logs
- Integration: Leverages existing notification system's timer infrastructure
- Dashboard: New widget showing workout statistics and upcoming sessions