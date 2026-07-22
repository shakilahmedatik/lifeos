## Purpose

News digest view with filtering, search, and article display.

## Requirements

### Requirement: Display news digest view
The system SHALL provide a dedicated news digest view showing all cached articles.

#### Scenario: Digest view loads articles
- **WHEN** user navigates to the news digest page
- **THEN** the system displays articles sorted by published date (newest first)

#### Scenario: Articles show metadata
- **WHEN** an article is displayed in the digest
- **THEN** it shows title, summary, source feed name, published date, and a link to original

### Requirement: Filter articles by feed
The system SHALL allow users to filter the digest by specific RSS feeds.

#### Scenario: Filter by single feed
- **WHEN** user selects feed with id "feed-1" from the filter dropdown
- **THEN** only articles from that feed are displayed in the digest

#### Scenario: Clear feed filter
- **WHEN** user clears the feed filter selection
- **THEN** all articles from all feeds are displayed

### Requirement: Search articles
The system SHALL allow users to search articles by title or summary content.

#### Scenario: Search by keyword
- **WHEN** user enters "artificial intelligence" in the search box
- **THEN** only articles containing that phrase in title or summary are displayed

#### Scenario: No search results
- **WHEN** search yields no matching articles
- **THEN** the system displays "No articles found matching your search"

### Requirement: Pagination
The news digest SHALL support pagination for browsing large numbers of articles.

#### Scenario: Load more articles
- **WHEN** user scrolls to the bottom of the digest list
- **THEN** the next batch of 20 articles is loaded and appended

#### Scenario: Initial page load
- **WHEN** user first loads the digest view
- **THEN** the first 20 articles are displayed

### Requirement: Mark article as read
The system SHALL track which articles the user has viewed.

#### Scenario: Article marked as read on view
- **WHEN** user clicks on an article to view it
- **THEN** the article is marked as read and visually distinguished (e.g., dimmed text)

#### Scenario: Read status persists
- **WHEN** user returns to the digest view later
- **THEN** previously viewed articles remain marked as read