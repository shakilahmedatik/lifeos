## ADDED Requirements

### Requirement: Fetch RSS feeds
The system SHALL periodically fetch and parse all active RSS feeds in the background.

#### Scenario: Successful feed fetch
- **WHEN** a background fetch cycle runs for active feed with id "feed-1"
- **THEN** the system parses the feed and stores new articles with title, url, publishedAt, and summary

#### Scenario: Feed fetch failure
- **WHEN** a feed URL is unreachable or returns an error
- **THEN** the system logs the error, marks the feed with lastFetchError, and continues with other feeds

#### Scenario: No new articles
- **WHEN** a feed is fetched but contains no new articles since last fetch
- **THEN** the system updates lastFetchedAt without creating new article records

### Requirement: Cache news articles
The system SHALL store fetched articles in a local cache with metadata.

#### Scenario: Article stored with metadata
- **WHEN** a new article is fetched from a feed
- **THEN** the system stores title, url, summary, publishedAt, feedId, and fetchedAt

#### Scenario: Article deduplication
- **WHEN** an article with the same URL already exists for the same feed
- **THEN** the system skips storing the duplicate

#### Scenario: Article retention
- **WHEN** articles are older than 30 days
- **THEN** the system automatically removes them from the cache

### Requirement: Configure fetch interval
The system SHALL allow users to set the fetch interval for RSS feeds.

#### Scenario: Set global fetch interval
- **WHEN** user sets fetch interval to 30 minutes
- **THEN** all active feeds are fetched every 30 minutes

#### Scenario: Default fetch interval
- **WHEN** no fetch interval is configured
- **THEN** the system uses a default interval of 60 minutes

### Requirement: Manual feed refresh
The system SHALL allow users to manually trigger an immediate fetch for a specific feed.

#### Scenario: Trigger manual refresh
- **WHEN** user requests manual refresh for feed with id "feed-1"
- **THEN** the system immediately fetches the feed and returns the count of new articles

#### Scenario: Manual refresh while fetch in progress
- **WHEN** user requests manual refresh while a fetch is already in progress
- **THEN** the system returns an error indicating "Fetch already in progress"