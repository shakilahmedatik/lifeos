export const queryKeys = {
  // Dashboard
  dashboard: {
    summary: (date?: string) => ["dashboard", "summary", date] as const,
  },
  // Routine
  routine: {
    tasks: (date: string) => ["routine", "tasks", date] as const,
    stats: () => ["routine", "stats"] as const,
    history: (query?: object) => ["routine", "history", query] as const,
  },
  // Habits
  habits: {
    all: () => ["habits"] as const,
    today: () => ["habits", "today"] as const,
    stats: (id: string, start: string, end: string) => ["habits", "stats", id, start, end] as const,
    weeklyReview: (weekStart?: string) => ["habits", "weekly-review", weekStart] as const,
  },
  // Workouts
  workouts: {
    all: () => ["workouts"] as const,
    exercises: () => ["workouts", "exercises"] as const,
    exerciseProgress: (id: string) => ["workouts", "exercises", id, "progress"] as const,
    sessions: (workoutId?: string) => ["workouts", "sessions", workoutId] as const,
    session: (id: string) => ["workouts", "sessions", id] as const,
    sessionLogs: (sessionId: string) => ["workouts", "sessions", sessionId, "logs"] as const,
    history: () => ["workouts", "history"] as const,
    stats: () => ["workouts", "stats"] as const,
    recent: () => ["workouts", "recent"] as const,
  },
  // Skills
  skills: {
    areas: () => ["skills", "areas"] as const,
    areaSummary: (areaId: string) => ["skills", "areas", areaId, "summary"] as const,
    resources: () => ["skills", "resources"] as const,
    resourcesByArea: (areaId: string) => ["skills", "resources", "by-area", areaId] as const,
    resourceProgress: (id: string) => ["skills", "resources", id, "progress"] as const,
    logsByResource: (resourceId: string) => ["skills", "logs", "by-resource", resourceId] as const,
    logsByRange: (start: string, end: string) => ["skills", "logs", "range", start, end] as const,
    progressBatch: (ids: string[]) => ["skills", "progress-batch", ids] as const,
  },
  // Finance
  finance: {
    accounts: () => ["finance", "accounts"] as const,
    activeAccounts: () => ["finance", "accounts", "active"] as const,
    accountBalance: (id: string) => ["finance", "accounts", id, "balance"] as const,
    categories: () => ["finance", "categories"] as const,
    activeCategories: () => ["finance", "categories", "active"] as const,
    transactions: (accountId?: string) => ["finance", "transactions", accountId] as const,
    transactionsByRange: (start: string, end: string) =>
      ["finance", "transactions", "range", start, end] as const,
    monthlySummary: (yearMonth: string) => ["finance", "monthly-summary", yearMonth] as const,
    categoryBreakdown: (yearMonth: string) => ["finance", "category-breakdown", yearMonth] as const,
    widget: () => ["finance", "widget"] as const,
    balances: () => ["finance", "balances"] as const,
  },
  // Reminders
  reminders: {
    all: (date?: string) => ["reminders", date] as const,
    today: () => ["reminders", "today"] as const,
  },
  // Notifications
  notifications: {
    all: () => ["notifications"] as const,
    due: () => ["notifications", "due"] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
    soundSettings: () => ["notifications", "sound-settings"] as const,
  },
  // Settings
  settings: () => ["settings"] as const,
  // Health
  health: () => ["health"] as const,
  // News
  news: {
    feeds: () => ["news", "feeds"] as const,
    feed: (id: string) => ["news", "feeds", id] as const,
    articles: (feedId?: string, search?: string) => ["news", "articles", feedId, search] as const,
    ticker: () => ["news", "ticker"] as const,
  },
  // Auth
  auth: {
    session: () => ["auth", "session"] as const,
  },
} as const;
