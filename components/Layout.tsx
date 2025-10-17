import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { HomeIcon, ListOrderedIcon, UsersIcon, BarChart3Icon, SettingsIcon, SunIcon, MoonIcon, MenuIcon, XIcon, FolderIcon } from './common/Icons';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Expenses', href: '/expenses', icon: ListOrderedIcon },
  { name: 'People', href: '/people', icon: UsersIcon },
  { name: 'Analytics', href: '/analytics', icon: BarChart3Icon },
  { name: 'Groups', href: '/groups', icon: FolderIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

const Layout: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinkClasses = "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors";
  const activeClasses = "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400";
  const inactiveClasses = "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700";
  
  const SidebarContent = () => (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">EquiShare</span>
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {theme === 'light' ? <MoonIcon className="w-5 h-5 text-slate-500" /> : <SunIcon className="w-5 h-5 text-slate-400" />}
            </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `${navLinkClasses} ${isActive ? activeClasses : inactiveClasses}`}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-800">
             <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
            </div>
            <SidebarContent />
          </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <SidebarContent />
        </div>
      </div>
      
      <div className="md:pl-64 flex flex-col flex-1">
        <header className="sticky top-0 z-10 md:hidden h-16 flex items-center px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
            <button
                type="button"
                className="h-12 w-12 -ml-3 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
             <span className="text-lg font-bold text-primary-600 dark:text-primary-400 ml-2">EquiShare</span>
        </header>
        <main className="flex-1">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;