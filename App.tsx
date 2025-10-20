import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { useAppStore } from './store/useAppStore';

import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import GetStartedPage from './pages/GetStartedPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import AddExpensePage from './pages/AddExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import PeoplePage from './pages/PeoplePage';
import AnalyticsPage from './pages/AnalyticsPage';
import GroupsPage from './pages/GroupsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { theme, setTheme, isLoggedIn, setDisplayCurrency } = useAppStore();

  const onboardedSetting = useLiveQuery(() => db.settings.get('onboarded'));
  const themeSetting = useLiveQuery(() => db.settings.get('theme'));
  const currencySetting = useLiveQuery(() => db.settings.get('currency'));

  useEffect(() => {
    if (themeSetting?.value) {
      setTheme(themeSetting.value);
    }
  }, [themeSetting?.value, setTheme]);

  useEffect(() => {
    if (currencySetting?.value) {
      setDisplayCurrency(currencySetting.value);
    }
  }, [currencySetting?.value, setDisplayCurrency]);


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
          <div className="w-16 h-16 p-3 mx-auto mb-4 bg-primary-600 rounded-2xl animate-pulse flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M18,2H6C4.89,2 4,2.89 4,4V18C4,19.11 4.89,20 6,20H18C19.11,20 20,19.11 20,18V4C20,2.89 19.11,2 18,2M12,5L18,9H6L12,5M13.5,13H13V11.5H11V13H10.5C9.67,13 9,13.67 9,14.5C9,15.33 9.67,16 10.5,16H11V17.5H13V16H13.5C14.33,16 15,15.33 15,14.5C15,13.67 14.33,13 13.5,13Z" />
            </svg>
          </div>
          <span className="text-slate-700 dark:text-slate-300">Loading EquiShare...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {isLoggedIn ? (
          <>
            {/* Standalone pages for logged-in users */}
            <Route path="/get-started" element={<GetStartedPage />} />

            {/* Layout-wrapped pages */}
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
              {/* Redirect any old auth routes to dashboard if somehow accessed while logged in */}
              <Route path="welcome" element={<Navigate to="/dashboard" replace />} />
              <Route path="onboarding" element={<Navigate to="/dashboard" replace />} />
              <Route path="login" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </>
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