import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { useAppStore } from './store/useAppStore';

import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import AddExpensePage from './pages/AddExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import PeoplePage from './pages/PeoplePage';
import AnalyticsPage from './pages/AnalyticsPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { theme, setTheme, isLoggedIn } = useAppStore();

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
  
  const isLoading = onboardedSetting === undefined;
  const isOnboarded = onboardedSetting?.value === true;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary-600 mx-auto mb-4 animate-pulse">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" fillOpacity="0.2"></path>
              <path d="M16.53 8.97a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L10.5 13.94l4.97-4.97a.75.75 0 011.06 0z" fill="currentColor"></path>
          </svg>
          <span className="text-slate-700 dark:text-slate-300">Loading EquiShare...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {isLoggedIn ? (
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
            {/* Redirect any onboarding/auth routes to dashboard if logged in */}
            <Route path="welcome" element={<Navigate to="/dashboard" replace />} />
            <Route path="onboarding" element={<Navigate to="/dashboard" replace />} />
            <Route path="login" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
           <>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to={isOnboarded ? "/login" : "/welcome"} replace />} />
           </>
        )}
      </Routes>
    </Router>
  );
}

export default App;