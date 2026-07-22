## ADDED Requirements

### Requirement: Add course enrollment
The system SHALL allow users to add course enrollments with course name, platform, and total lessons.

#### Scenario: Successful course addition
- **WHEN** user submits course details (name, platform, total lessons)
- **THEN** system creates course enrollment with 0% progress

#### Scenario: Duplicate course prevention
- **WHEN** user tries to add a course that already exists
- **THEN** system shows error message and prevents duplicate entry

### Requirement: Update course progress
The system SHALL allow users to update course completion percentage.

#### Scenario: Progress update
- **WHEN** user updates course completion percentage
- **THEN** system stores new percentage and updates last accessed timestamp

#### Scenario: Invalid percentage
- **WHEN** user enters percentage outside 0-100 range
- **THEN** system shows validation error and prevents update

### Requirement: View course progress
The system SHALL display all enrolled courses with current progress.

#### Scenario: Course list displays correctly
- **WHEN** user navigates to course progress view
- **THEN** system shows all courses with name, platform, progress percentage, and last accessed date

#### Scenario: Empty state
- **WHEN** user has no enrolled courses
- **THEN** system shows message to add first course

### Requirement: Delete course enrollment
The system SHALL allow users to remove course enrollments.

#### Scenario: Delete course
- **WHEN** user confirms deletion of a course enrollment
- **THEN** system removes the course and associated progress data