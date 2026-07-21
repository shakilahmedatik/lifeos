## 1. Backend Domain & Types

- [x] 1.1 Create `backend/src/modules/habits/domain/types.ts` with Habit, HabitLog, HabitFrequency, NewHabitInput, NewHabitLogInput types
- [x] 1.2 Create `backend/src/modules/habits/domain/rules.ts` with streak calculation logic (currentStreak, longestStreak, isDueToday)

## 2. Backend Ports (Interfaces)

- [x] 2.1 Create `backend/src/modules/habits/ports/habit-repository.ts` with HabitRepository interface (CRUD + getByFrequency)
- [x] 2.2 Create `backend/src/modules/habits/ports/habit-log-repository.ts` with HabitLogRepository interface (create, delete, getByHabitAndDate, getByDateRange)

## 3. Backend Adapters (Storage)

- [x] 3.1 Create `backend/src/modules/habits/adapters/habit-json-repository.ts` implementing HabitRepository with JSON file storage
- [x] 3.2 Create `backend/src/modules/habits/adapters/habit-log-json-repository.ts` implementing HabitLogRepository with JSON file storage

## 4. Backend Application Services

- [x] 4.1 Create `backend/src/modules/habits/application/habit-service.ts` with createHabit, listHabits, updateHabit, deleteHabit functions
- [x] 4.2 Create `backend/src/modules/habits/application/habit-log-service.ts` with logHabit, unlogHabit, getTodayDueHabits, batchLogHabits functions
- [x] 4.3 Create `backend/src/modules/habits/application/habit-stats-service.ts` with getHabitStats, calculateStreaks functions
- [x] 4.4 Create `backend/src/modules/habits/application/weekly-review-service.ts` with getWeeklySummary function

## 5. Backend API Routes

- [x] 5.1 Create `backend/src/modules/habits/api/router.ts` with habit CRUD endpoints (POST, GET, PATCH, DELETE /api/habits)
- [x] 5.2 Add habit logging endpoints (POST /api/habits/:id/log, DELETE /api/habits/:id/log/:date)
- [x] 5.3 Add batch logging endpoint (POST /api/habits/log-batch)
- [x] 5.4 Add habit stats endpoint (GET /api/habits/:id/stats)
- [x] 5.5 Add weekly review endpoint (GET /api/habits/weekly-review)

## 6. Backend Integration

- [x] 6.1 Register habits module router in `backend/src/index.ts`
- [x] 6.2 Extend dashboard summary endpoint to include `dueHabits` array (max 8 items)

## 7. Frontend Habit Components

- [x] 7.1 Create `frontend/src/modules/habits/HabitChip.tsx` component for dashboard quick-log
- [x] 7.2 Create `frontend/src/modules/habits/StreakBadge.tsx` component showing current/longest streak
- [x] 7.3 Create `frontend/src/modules/habits/HabitList.tsx` component for habit management view
- [x] 7.4 Create `frontend/src/modules/habits/HabitForm.tsx` component for creating/editing habits
- [x] 7.5 Create `frontend/src/modules/habits/WeeklyReviewWidget.tsx` component for weekly summary

## 8. Frontend API Integration

- [x] 8.1 Create `frontend/src/modules/habits/api.ts` with fetch wrapper functions for all habit endpoints
- [x] 8.2 Create `frontend/src/modules/habits/useHabits.ts` hook for habit state management

## 9. Dashboard Integration

- [x] 9.1 Modify `frontend/src/modules/dashboard/DashboardSummary.tsx` to fetch and display habit chips
- [x] 9.2 Add habit quick-log click handler with optimistic UI update

## 10. Testing

- [x] 10.1 Create `backend/src/modules/habits/__tests__/habit-service.test.ts` for habit CRUD
- [x] 10.2 Create `backend/src/modules/habits/__tests__/habit-log-service.test.ts` for logging
- [x] 10.3 Create `backend/src/modules/habits/__tests__/habit-stats-service.test.ts` for streak calculation
- [x] 10.4 Create `frontend/src/modules/habits/__tests__/HabitChip.test.tsx` component test
- [x] 10.5 Run full test suite and fix any failures
