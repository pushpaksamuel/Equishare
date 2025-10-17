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
  }, [themeSetting, setTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // The query is loading if onboardedSetting is undefined.
  // It is not onboarded if the setting is null or its value is not true.
  const isLoading = onboardedSetting === undefined;
  const isOnboarded = onboardedSetting?.value === true;

  if (isLoading) {
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