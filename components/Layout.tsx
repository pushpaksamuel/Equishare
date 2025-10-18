import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { PlusCircleIcon } from './common/Icons';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'People', href: '/people' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Settings', href: '/settings' },
];

const Layout: React.FC = () => {
  const navLinkClasses = "px-1 py-4 text-sm font-medium border-b-2";
  const activeClasses = "text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400";
  const inactiveClasses = "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-transparent";
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                 <svg className="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.92 14.61l-3.69-3.69a.996.996 0 111.41-1.41L10.08 14.2l5.6-5.6a.996.996 0 111.41 1.41l-6.31 6.31a.996.996 0 01-1.41 0z"/></svg>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">EquiShare</span>
              </Link>
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `${navLinkClasses} ${isActive ? activeClasses : inactiveClasses}`}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex items-center">
              <Link to="/expenses/add" className="ml-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <PlusCircleIcon className="w-5 h-5 mr-2 -ml-1" />
                Add Expense
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="bg-slate-100 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
