## Why

The dashboard currently shows tasks, habits, and finance data but lacks external information feeds. Adding a news module with RSS aggregation and a dashboard ticker/digest enables users to stay informed without leaving the app, providing a personalized news feed alongside their daily planning workflow.

## What Changes

- Add RSS feed subscription management (add, edit, delete feeds)
- Implement background RSS fetching and parsing with caching
- Create a news ticker component for the dashboard
- Build a news digest view with filtering and search
- Add API endpoints for feed management and news retrieval
- Integrate news data into the dashboard summary widget

## Capabilities

### New Capabilities
- `rss-feeds`: RSS feed subscription management and configuration
- `news-aggregation`: Background RSS fetching, parsing, and caching
- `news-ticker`: Dashboard news ticker component and data flow
- `news-digest`: News digest view with filtering, search, and article display

### Modified Capabilities
- `dashboard`: Add news ticker widget and news data to summary response

## Impact

- New database tables or storage for RSS feed subscriptions and cached articles
- New API endpoints under `/api/news/` for feeds and articles
- Frontend components for ticker and digest views
- Dashboard component updates for news widget
- Background job or service for periodic RSS fetching
- Dependencies on RSS parsing library (e.g., rss-parser)