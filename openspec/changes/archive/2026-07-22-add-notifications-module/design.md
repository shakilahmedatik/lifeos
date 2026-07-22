## Context

LifeOS is building a comprehensive personal management system. The notifications module (§7.6) addresses the lateness/meeting-prep problem by providing per-task reminders with sound alerts. This module is positioned in Phase 1.5 (after Habits, before Workout) to enable Workout's future "coach mode" timers to reuse the same sound-alert plumbing.

Current state: No notification infrastructure exists. Tasks exist but lack reminder capabilities. Sound playback is not implemented.

## Goals / Non-Goals

**Goals:**
- Enable users to set per-task reminders with configurable timing
- Deliver notifications in real-time via Server-Sent Events (SSE)
- Provide audible sound alerts for different notification types
- Create a foundation that Workout's "coach mode" timers can reuse

**Non-Goals:**
- Push notifications to mobile devices (future consideration)
- Complex notification grouping or batching
- User-configurable sound uploads (use preset sounds initially)
- Integration with external calendar systems

## Decisions

**1. SSE for real-time delivery**
- Decision: Use Server-Sent Events for notification delivery
- Rationale: Simpler than WebSockets for one-way server-to-client communication, better browser support, automatic reconnection
- Alternatives considered: WebSockets (overkill for unidirectional), Polling (inefficient), Service Workers (complex)

**2. Browser-native Web Audio API for sound**
- Decision: Use Web Audio API for sound playback
- Rationale: No external dependencies, good browser support, sufficient for notification sounds
- Alternatives considered: HTML5 Audio element (less control), Howler.js (unnecessary dependency)

**3. Task-based reminder scheduling**
- Decision: Attach reminders directly to tasks with relative timing (e.g., "15 minutes before")
- Rationale: Aligns with user mental model, simpler than absolute scheduling
- Alternatives considered: Separate calendar events (duplication), Time-based triggers only (less context)

**4. Preset notification sounds**
- Decision: Provide 3-5 built-in notification sounds
- Rationale: Quick implementation, consistent experience, avoids copyright issues
- Alternatives considered: User uploads (complex), External sound library (dependency)

## Risks / Trade-offs

**[Risk]** Browser tab may be inactive when notification fires → **Mitigation**: Use Notification API as fallback, ensure SSE reconnection logic

**[Risk]** Sound may not play due to browser autoplay policies → **Mitigation**: Require user interaction before first sound, show visual notification as backup

**[Risk]** SSE connection drops during extended periods → **Mitigation**: Implement heartbeat mechanism, exponential backoff reconnection

**[Trade-off]** Limited customization (preset sounds only) → **Justification**: Faster delivery, can add customization later

**[Trade-off]** No mobile push notifications → **Justification**: Web-based solution sufficient for initial release, mobile app integration is future work
