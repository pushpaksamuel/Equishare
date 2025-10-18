import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { useAppStore } from './store/useAppStore';

import Layout from './components/Layout';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import AddExpensePage from './pages/AddExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import PeoplePage from './pages/PeoplePage';
import AnalyticsPage from './pages/AnalyticsPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { theme, setTheme } = useAppStore();

  const onboardedSetting = useLiveQuery(() => db.settings.get('onboarded'));
  const themeSetting = useLiveQuery(() => db.settings.get('theme'));

  useEffect(() => {
    if (themeSetting?.value) {
      setTheme(themeSetting.value);
    }
  }, [themeSetting?.value, setTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // The query for onboardedSetting can return undefined if the setting is not found,
  // which is indistinguishable from the initial loading state of useLiveQuery.
  // This was causing an infinite loading screen for new users.
  // By setting isLoading to false, we prevent this, with the minor tradeoff of
  // briefly showing the onboarding page for existing users on first load.
  const isLoading = false;
  const isOnboarded = onboardedSetting?.value === true;

  if (isLoading) {
    // This block is now effectively dead code but kept for clarity.
    return <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {!isOnboarded ? (
          <Route path="*" element={<OnboardingPage />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="expenses/add" element={<AddExpensePage />} />
            <Route path="expenses/edit/:id" element={<EditExpensePage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;