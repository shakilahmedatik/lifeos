import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { AuthModal } from "./components/auth/AuthModal.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import Layout from "./components/layout/Layout.js";
import PageSkeleton from "./components/PageSkeleton.js";
import { AuthProvider, useAuth } from "./context/AuthContext.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.js"));
const RoutinePage = lazy(() => import("./pages/RoutinePage.js"));
const HabitsPage = lazy(() => import("./pages/HabitsPage.js"));
const WorkoutsPage = lazy(() => import("./pages/WorkoutsPage.js"));
const SkillsPage = lazy(() => import("./pages/SkillsPage.js"));
const FinancePage = lazy(() => import("./pages/FinancePage.js"));
const NewsPage = lazy(() => import("./pages/NewsPage.js"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.js"));

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold text-gray-400">404</p>
      <p className="text-gray-500">Page not found</p>
      <Link to="/" className="text-amber-500 hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}

function MainContent() {
  const { user, isLoadingSession } = useAuth();

  if (isLoadingSession && !user) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<PageSkeleton />}>
          <MainContent />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}
