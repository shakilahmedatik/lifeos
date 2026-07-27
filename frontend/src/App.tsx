import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import Layout from "./components/layout/Layout.js";
import DashboardPage from "./pages/DashboardPage.js";
import FinancePage from "./pages/FinancePage.js";
import HabitsPage from "./pages/HabitsPage.js";
import NewsPage from "./pages/NewsPage.js";
import NotificationsPage from "./pages/NotificationsPage.js";
import RoutinePage from "./pages/RoutinePage.js";
import SkillsPage from "./pages/SkillsPage.js";
import WorkoutsPage from "./pages/WorkoutsPage.js";

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
