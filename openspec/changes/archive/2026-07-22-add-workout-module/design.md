## Context

LifeOS is a local-first personal productivity system with a modular architecture. The system currently handles daily planning (routine), habit tracking, and notifications. The workout module is Phase 2 of the feature roadmap, building on the notification system's timer infrastructure.

Current state:
- Backend uses domain-driven design with ports/adapters pattern
- Frontend is modular with separate modules for each feature area
- Database is SQLite with migrations
- Notification system has timer/alert infrastructure with sound support

## Goals / Non-Goals

**Goals:**
- Enable users to create and manage workout routines with exercises
- Provide real-time coach mode with timers for sets and rest periods
- Include video reference links for exercise form guidance
- Track workout history and performance metrics over time
- Reuse existing notification system's timer infrastructure
- Maintain consistency with existing module patterns and architecture

**Non-Goals:**
- Advanced workout program generation (deferred to Phase 6)
- Integration with external fitness devices or APIs
- Social features or workout sharing
- Mobile companion view (Phase 6 stretch goal)
- Sophisticated analytics beyond basic progress tracking

## Decisions

**Decision 1: Module Structure**
- Follow existing backend pattern: domain → application → ports → sqlite adapter → api routes
- Frontend module with separate views for planner, coach, and history
- Rationale: Consistency with existing codebase, proven pattern for other modules

**Decision 2: Database Schema**
- Separate tables for workouts, exercises, workout_sessions, and exercise_logs
- Workouts contain exercise templates with default sets/reps
- Sessions track actual performed workouts with actual values
- Rationale: Separates planned vs actual, enables history tracking

**Decision 3: Timer Implementation**
- Reuse notification system's timer infrastructure for coach mode
- Extend notifications module to support workout-specific alerts
- Use SSE (Server-Sent Events) for real-time timer updates
- Rationale: Leverages existing sound-alert plumbing, avoids duplication

**Decision 4: Video References**
- Store video URLs as strings in exercise table
- Support YouTube and other video platforms
- Display as clickable links in coach mode
- Rationale: Simple implementation, no need for video hosting

**Decision 5: Dashboard Integration**
- Add workout widget to existing dashboard
- Show upcoming workouts, recent sessions, and basic stats
- Follow existing widget pattern and styling
- Rationale: Consistent with dashboard architecture

## Risks / Trade-offs

**Risk: Timer complexity** → Mitigation: Reuse notification system's proven timer infrastructure, extend rather than rebuild

**Risk: Schema changes** → Mitigation: Design schema to be extensible for future features, use migrations

**Risk: Performance with history** → Mitigation: Index frequently queried columns, implement pagination for history views

**Trade-off: Simplicity vs features** → Chose simpler implementation for Phase 2, defer advanced features to Phase 6

**Trade-off: Local storage vs sync** → Keep local-first approach consistent with other modules, defer sync to future phase