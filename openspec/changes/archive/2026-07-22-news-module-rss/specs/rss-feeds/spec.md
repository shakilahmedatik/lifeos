## ADDED Requirements

### Requirement: Add RSS feed
The system SHALL allow users to add an RSS feed by providing a URL and optional title.

#### Scenario: Valid feed URL provided
- **WHEN** user submits a valid RSS/Atom feed URL with title "Tech News"
- **THEN** the feed is saved with status "active" and returned in the feeds list

#### Scenario: Invalid feed URL
- **WHEN** user submits a URL that is not a valid RSS/Atom feed
- **THEN** the system returns an error indicating "Invalid feed format"

#### Scenario: Duplicate feed URL
- **WHEN** user submits a URL that already exists in the system
- **THEN** the system returns an error indicating "Feed already exists"

### Requirement: Edit RSS feed
The system SHALL allow users to update an existing feed's title and URL.

#### Scenario: Update feed title
- **WHEN** user updates the title of feed with id "feed-1" to "Updated Title"
- **THEN** the feed title is updated and the change is reflected in the feeds list

#### Scenario: Update feed URL
- **WHEN** user updates the URL of feed with id "feed-1" to a new valid RSS URL
- **THEN** the feed URL is updated and the system begins fetching from the new URL

### Requirement: Delete RSS feed
The system SHALL allow users to delete an RSS feed and its cached articles.

#### Scenario: Delete existing feed
- **WHEN** user deletes feed with id "feed-1"
- **THEN** the feed and all its associated articles are removed from the system

#### Scenario: Confirm deletion
- **WHEN** user initiates feed deletion
- **THEN** the system displays a confirmation dialog before proceeding

### Requirement: List RSS feeds
The system SHALL return all subscribed RSS feeds with their metadata.

#### Scenario: Feeds exist
- **WHEN** user requests the feeds list
- **THEN** the system returns an array of feeds with id, title, url, lastFetched, and status

#### Scenario: No feeds subscribed
- **WHEN** user requests the feeds list and no feeds exist
- **THEN** the system returns an empty array

### Requirement: Toggle feed active status
The system SHALL allow users to enable or disable an RSS feed without deleting it.

#### Scenario: Disable active feed
- **WHEN** user disables feed with id "feed-1"
- **THEN** the feed status changes to "inactive" and it is excluded from background fetching

#### Scenario: Enable inactive feed
- **WHEN** user enables feed with id "feed-1"
- **THEN** the feed status changes to "active" and it is included in background fetching