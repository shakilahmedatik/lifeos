import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import Layout from "./components/layout/Layout.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.js"));
const RoutinePage = lazy(() => import("./pages/RoutinePage.js"));
const HabitsPage = lazy(() => import("./pages/HabitsPage.js"));
const WorkoutsPage = lazy(() => import("./pages/WorkoutsPage.js"));
const SkillsPage = lazy(() => import("./pages/SkillsPage.js"));
const FinancePage = lazy(() => import("./pages/FinancePage.js"));
const NewsPage = lazy(() => import("./pages/NewsPage.js"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.js"));

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse max-w-7xl mx-auto">
      <div className="h-8 bg-card/60 rounded-lg w-1/4" />
      <div className="h-64 bg-card/40 rounded-xl border border-border/50" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="routine" element={<RoutinePage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
