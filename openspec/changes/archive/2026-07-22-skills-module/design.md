## Context

LifeOS is a personal dashboard application built with React. The app currently tracks habits, routines, and projects. The Skills module extends this to learning activities, addressing the need for systematic skill acquisition tracking before learning history accumulates.

Current state: No learning tracking capabilities exist. Users need to log study sessions, track course progress, and organize skills by category.

## Goals / Non-Goals

**Goals:**
- Enable users to log learning sessions with duration, skill focus, and notes
- Track course enrollment and completion progress
- Organize learning activities by skill categories
- Provide backup/export for learning data
- Integrate learning metrics into existing dashboard

**Non-Goals:**
- Real-time collaboration on learning goals
- Integration with external course platforms (e.g., Coursera, Udemy)
- AI-powered learning recommendations
- Social features or learning communities

## Decisions

**Data Storage: Use local state with localStorage persistence**
- Rationale: Matches existing app architecture (habits, routines use localStorage)
- Alternatives considered: IndexedDB (overkill for this data volume), backend API (adds complexity)
- Decision: LocalStorage with JSON serialization for simplicity

**Component Structure: Feature-based modules**
- Rationale: Follows existing patterns in the codebase
- Each capability (learning-sessions, course-progress, etc.) gets its own component directory
- Shared components for common UI patterns (duration picker, progress bars)

**Backup Format: JSON with metadata**
- Rationale: Portable, human-readable, easy to import/export
- Includes timestamps, version info, and data schema for future compatibility
- CSV export option for spreadsheet analysis

**Dashboard Integration: New widget section**
- Rationale: Leverages existing dashboard component structure
- Add "Learning" section with recent sessions and overall progress
- Minimal disruption to existing layout

## Risks / Trade-offs

**Risk: localStorage size limits**
- Mitigation: Implement data archiving for old sessions, compress backup exports

**Risk: Data loss on browser clear**
- Mitigation: Prominent backup feature, export reminders after X sessions

**Risk: Component complexity**
- Mitigation: Start with MVP features, iterate based on usage

**Trade-off: No real-time sync**
- Acceptable: Personal app, single-user, offline-first approach

**Trade-off: Manual session logging**
- Acceptable: Users prefer intentional tracking over automatic capture

## Migration Plan

1. Create new components in feature directories
2. Add data models and localStorage utilities
3. Integrate with dashboard layout
4. Test backup/export functionality
5. Deploy with feature flag for gradual rollout

## Open Questions

- Should sessions have minimum/maximum duration limits?
- How to handle skill category creation (predefined vs user-defined)?
- Backup encryption for sensitive learning data?