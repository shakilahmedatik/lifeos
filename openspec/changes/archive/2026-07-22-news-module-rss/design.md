## Context

The LifeOS dashboard currently displays tasks, habits, and finance data. Users need to stay informed about external news without leaving the application. This change adds an RSS news module with background aggregation, a dashboard ticker, and a full digest view.

Current state: No news/RSS functionality exists. The dashboard aggregates data from tasks, habits, and finance modules. The app uses a Next.js frontend with API routes and SQLite storage.

## Goals / Non-Goals

**Goals:**
- Enable users to subscribe to RSS feeds and manage them
- Fetch and cache RSS content in the background
- Display a news ticker on the dashboard for quick glances
- Provide a dedicated news digest view with filtering and search
- Integrate news data into the existing dashboard summary

**Non-Goals:**
- Social media integration (Twitter/X, Facebook)
- Article recommendation engine
- User comments or social features
- Paywall or premium content handling
- Mobile app (web only for now)

## Decisions

### Decision: RSS Parsing Library
**Choice**: Use `rss-parser` npm package
**Rationale**: Well-maintained, handles standard RSS/Atom feeds, simple API, no external dependencies
**Alternatives considered**:
- `feedparser`: Older, less maintained
- Custom parser: More work, error-prone with edge cases
- `xml2js`: Lower-level, requires more code

### Decision: Storage Strategy
**Choice**: SQLite with two tables - `rss_feeds` and `news_articles`
**Rationale**: Consistent with existing app architecture, no new infrastructure needed
**Alternatives considered**:
- JSON file storage: Less queryable, harder to filter/search
- In-memory only: Lost on restart, not scalable

### Decision: Background Fetching
**Choice**: Server-side interval-based fetching with configurable refresh rates
**Rationale**: Simple to implement, reliable, works with SQLite
**Alternatives considered**:
- Webhook-based (push): Requires feed support, complex
- Client-side fetching: CORS issues, less reliable
- External service (e.g., Zapier): Adds dependency and cost

### Decision: Ticker Update Strategy
**Choice**: Frontend polls `/api/news/ticker` every 60 seconds
**Rationale**: Balance between freshness and server load
**Alternatives considered**:
- WebSocket: More complex, overkill for news frequency
- Server-sent events: Good but polling is simpler
- No auto-refresh: Poor UX

## Risks / Trade-offs

**Feed parsing failures** → Log errors gracefully, skip malformed feeds, show partial results
**RSS feed downtime** → Cache articles for 24h, show cached content when feeds are unavailable
**Rate limiting** → Implement fetch intervals per feed, respect robots.txt
**Storage growth** → Auto-prune articles older than 30 days, configurable retention
**Performance** → Background fetching runs during low-traffic periods, paginate digest API