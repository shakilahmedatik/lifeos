## Why

The LifeOS app needs a Skills module to track learning progress, log study sessions, and manage course enrollments. This module will help users systematically acquire new skills by logging practice time, tracking course completion, and maintaining a learning history. In-app backup/export is critical before valuable learning history accumulates.

## What Changes

- Add learning session logging with duration, skill category, and notes
- Implement course progress tracking with completion percentages
- Create skill category management for organizing learning activities
- Add in-app backup/export functionality for learning data
- Integrate with existing dashboard for learning insights

## Capabilities

### New Capabilities
- `learning-sessions`: Log and track individual study/practice sessions with duration, skill focus, and reflection notes
- `course-progress`: Manage course enrollments, track completion status, and store progress percentages
- `skill-categories`: Organize learning activities by skill domain (e.g., programming, design, language)
- `learning-backup`: Export and backup learning history data in portable formats

### Modified Capabilities
- `dashboard`: Add learning statistics widget showing recent sessions and overall progress

## Impact

- New React components for session logging, course management, and skill organization
-扩展 dashboard with learning metrics
- New data models for sessions, courses, and skill categories
- Backup/export service integration
- Mobile-responsive design for on-the-go logging