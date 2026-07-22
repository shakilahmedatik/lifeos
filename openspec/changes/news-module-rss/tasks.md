## 1. Database and Storage Setup

- [x] 1.1 Create RSS feeds table with id, title, url, status, lastFetchedAt, lastFetchError, createdAt
- [x] 1.2 Create news articles table with id, feedId, title, url, summary, publishedAt, fetchedAt, isRead
- [x] 1.3 Add database migration for news tables
- [x] 1.4 Implement CRUD operations for RSS feeds

## 2. RSS Feed Management API

- [x] 2.1 Create POST /api/news/feeds endpoint to add new feeds
- [x] 2.2 Create GET /api/news/feeds endpoint to list all feeds
- [x] 2.3 Create PUT /api/news/feeds/[id] endpoint to update feeds
- [x] 2.4 Create DELETE /api/news/feeds/[id] endpoint to delete feeds
- [x] 2.5 Create PATCH /api/news/feeds/[id]/toggle endpoint to enable/disable feeds

## 3. RSS Feed Management UI

- [x] 3.1 Create feed management page component
- [x] 3.2 Implement feed list display with status indicators
- [x] 3.3 Build add feed form with URL validation
- [x] 3.4 Add edit feed functionality
- [x] 3.5 Implement delete feed with confirmation dialog
- [x] 3.6 Add feed active/inactive toggle switch

## 4. Background RSS Fetching

- [x] 4.1 Install and configure rss-parser dependency
- [x] 4.2 Create RSS fetch service with feed parsing logic
- [x] 4.3 Implement article deduplication by URL
- [x] 4.4 Create background fetch scheduler with configurable interval
- [x] 4.5 Add manual refresh endpoint POST /api/news/feeds/[id]/refresh
- [x] 4.6 Implement error logging and feed status updates

## 5. News API Endpoints

- [x] 5.1 Create GET /api/news/articles endpoint with pagination
- [x] 5.2 Create GET /api/news/ticker endpoint for dashboard ticker
- [x] 5.3 Add feed filtering to articles endpoint
- [x] 5.4 Add search functionality to articles endpoint
- [x] 5.5 Create PATCH /api/news/articles/[id]/read endpoint to mark as read

## 6. News Digest View

- [x] 6.1 Create news digest page component
- [x] 6.2 Implement article list with metadata display
- [x] 6.3 Add feed filter dropdown component
- [x] 6.4 Implement search box with debounced filtering
- [x] 6.5 Add infinite scroll pagination
- [x] 6.6 Implement article read status tracking
- [x] 6.7 Add article click to open in new tab

## 7. Dashboard Integration

- [x] 7.1 Create news ticker component for dashboard
- [x] 7.2 Implement ticker auto-refresh every 60 seconds
- [x] 7.3 Add smooth animation for new articles
- [x] 7.4 Update dashboard summary to include news data
- [x] 7.5 Add news widget to dashboard layout
- [x] 7.6 Position ticker below Now/Next card

## 8. Configuration and Settings

- [x] 8.1 Add fetch interval configuration to settings
- [x] 8.2 Add article retention period configuration
- [x] 8.3 Create default settings initialization

## 9. Testing and Polish

- [x] 9.1 Add unit tests for RSS parsing logic
- [x] 9.2 Add integration tests for news API endpoints
- [x] 9.3 Test feed management UI interactions
- [x] 9.4 Verify ticker performance with many articles
- [x] 9.5 Test search and filter functionality
- [x] 9.6 Add error handling for edge cases (malformed feeds, network errors)