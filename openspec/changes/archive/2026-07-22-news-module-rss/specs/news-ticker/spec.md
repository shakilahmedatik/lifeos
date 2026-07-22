## ADDED Requirements

### Requirement: Display news ticker on dashboard
The dashboard SHALL display a news ticker component showing recent articles from subscribed feeds.

#### Scenario: Ticker displays recent articles
- **WHEN** user views the dashboard
- **THEN** the news ticker shows the 5 most recent articles across all active feeds

#### Scenario: Ticker shows article metadata
- **WHEN** an article appears in the ticker
- **THEN** it displays title, source feed name, and published time in relative format (e.g., "2h ago")

#### Scenario: No articles available
- **WHEN** no articles exist in the cache
- **THEN** the ticker displays "No news available" or is hidden

### Requirement: Ticker auto-refresh
The news ticker SHALL automatically refresh to show new articles.

#### Scenario: Ticker refresh interval
- **WHEN** the ticker is displayed on the dashboard
- **THEN** it polls for new articles every 60 seconds

#### Scenario: New articles appear smoothly
- **WHEN** new articles are fetched during a refresh
- **THEN** they are added to the ticker with a smooth animation

### Requirement: Navigate to article
Users SHALL be able to click on a ticker article to open the full article.

#### Scenario: Click opens article
- **WHEN** user clicks on an article in the ticker
- **THEN** the article opens in a new browser tab at the original source URL

#### Scenario: Middle-click opens article
- **WHEN** user middle-clicks on an article in the ticker
- **THEN** the article opens in a new browser tab without navigating away from the dashboard

### Requirement: Ticker layout
The news ticker SHALL be positioned and styled consistently with the dashboard layout.

#### Scenario: Ticker position
- **WHEN** the dashboard loads
- **THEN** the news ticker is displayed below the Now/Next card and above other widgets

#### Scenario: Ticker responsive design
- **WHEN** viewed on mobile or narrow viewport
- **THEN** the ticker scrolls horizontally to show all articles