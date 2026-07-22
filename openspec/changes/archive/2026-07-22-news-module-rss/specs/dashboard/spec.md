## MODIFIED Requirements

### Requirement: Dashboard widgets
The dashboard SHALL display widgets for each active module showing glanceable metrics.

#### Scenario: Finance widget displayed
- **WHEN** user views dashboard
- **THEN** finance widget shows current month's income, expense, and net total

#### Scenario: News widget displayed
- **WHEN** user views dashboard
- **THEN** news widget shows the 5 most recent articles from subscribed RSS feeds

### Requirement: Dashboard summary data
The dashboard SHALL aggregate data from all modules into a unified summary.

#### Scenario: Finance data in summary
- **WHEN** dashboard loads summary
- **THEN** finance totals are included in the overall dashboard summary

#### Scenario: News data in summary
- **WHEN** dashboard loads summary
- **THEN** news article count and latest article metadata are included in the overall dashboard summary