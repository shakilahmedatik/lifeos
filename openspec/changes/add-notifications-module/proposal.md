## Why

Notifications module (§7.6) is owner-requested and time-sensitive, placed in Phase 1.5 to directly address the lateness/meeting-prep problem identified in §2. This early placement ensures that Workout's "coach mode" timers can reuse the same sound-alert plumbing when implemented later.

## What Changes

- Add per-task reminder system with sound alerts
- Implement Server-Sent Events (SSE) for real-time notification delivery
- Create notification scheduling and management interface
- Provide sound playback functionality for different notification types

## Capabilities

### New Capabilities
- `notifications`: Per-task reminders with sound via SSE, including scheduling, delivery, and sound playback

### Modified Capabilities
None - no existing spec requirements are changing. Workout's future "coach mode" will consume this new capability but doesn't modify existing workout spec requirements.

## Impact

- New notification service and SSE infrastructure
- Sound playback system for browser/app environment
- Task integration points for reminder scheduling
- Future Workout module integration (coach mode timers)
