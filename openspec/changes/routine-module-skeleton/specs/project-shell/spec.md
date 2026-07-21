## MODIFIED Requirements

### Requirement: Module folder template
Empty module folders SHALL follow the hexagonal template: `domain/`, `application/`, `ports/`, `adapters/sqlite/`, `api/`. Each folder SHALL contain a `.gitkeep` or placeholder file.

#### Scenario: Folder existence
- **WHEN** the scaffold is complete
- **THEN** `backend/src/modules/routine/` and `backend/src/modules/dashboard/` each contain the full subfolder structure

#### Scenario: Routine module files populated
- **WHEN** Phase 0 implementation is complete
- **THEN** `backend/src/modules/routine/` contains `domain/types.ts`, `domain/rules.ts`, `application/use-cases.ts`, `ports/task-repository.ts`, `adapters/sqlite/sqlite-task-repository.ts`, and `api/router.ts`

#### Scenario: Dashboard module files populated
- **WHEN** Phase 0 implementation is complete
- **THEN** `backend/src/modules/dashboard/` contains `application/summary.ts`, `ports/dashboard-dependencies.ts`, and `api/router.ts`
