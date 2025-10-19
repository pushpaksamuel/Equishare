import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useData } from '../hooks/useData';
import Avatar from './common/Avatar';
import { HomeIcon, ListOrderedIcon, UsersIcon, BarChart3Icon, FolderIcon, SettingsIcon, SunIcon, MoonIcon, MenuIcon, LogOutIcon } from './common/Icons';
import Button from './common/Button';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/expenses', label: 'Expenses', icon: ListOrderedIcon },
  { to: '/people', label: 'People', icon: UsersIcon },
  { to: '/analytics', label: 'Analytics', icon: BarChart3Icon },
  { to: '/groups', label: 'Groups', icon: FolderIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const Layout: React.FC = () => {
  const { theme, toggleTheme, logout } = useAppStore();
  const { user } = useData();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/expenses/add')) return 'Add Expense';
    if (path.startsWith('/expenses/edit')) return 'Edit Expense';
    
    const currentLink = navLinks.find(link => path.startsWith(link.to));
    return currentLink?.label || 'Dashboard';
  };
  
  const NavItem: React.FC<{ to: string, label: string, icon: React.FC<any> }> = ({ to, label, icon: Icon }) => {
    // Match parent routes. e.g. /expenses/add should activate /expenses link
    const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
    return (
      <NavLink
        to={to}
        onClick={() => setSidebarOpen(false)}
        className={
          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          }`
        }
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </NavLink>
    );
  };
  
  const SidebarContent = () => (
     <div className="flex flex-col h-full bg-white dark:bg-slate-800 p-4 border-r border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-primary-600">
              <path d="M18,2H6C4.89,2 4,2.89 4,4V18C4,19.11 4.89,20 6,20H18C19.11,20 20,19.11 20,18V4C20,2.89 19.11,2 18,2M12,5L18,9H6L12,5M13.5,13H13V11.5H11V13H10.5C9.67,13 9,13.67 9,14.5C9,15.33 9.67,16 10.5,16H11V17.5H13V16H13.5C14.33,16 15,15.33 15,14.5C15,13.67 14.33,13 13.5,13Z" />
            </svg>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">EquiShare</span>
        </div>
        <nav className="flex-1 space-y-2">
            {navLinks.map(link => <NavItem key={link.to} {...link} />)}
        </nav>
        <div className="mt-auto space-y-4">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Theme</span>
                <Button size="icon" variant="secondary" onClick={toggleTheme}>
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </Button>
            </div>
             <Button variant="secondary" className="w-full" onClick={handleLogout}>
                <LogOutIcon className="w-5 h-5 mr-2" />
                Logout
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <SidebarContent />
      </aside>
      
      {/* Mobile Sidebar */}
       <div className={`fixed inset-0 z-40 lg:hidden transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="w-64 h-full">
            <SidebarContent />
          </div>
       </div>
       {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Global Header */}
        <header className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="secondary" onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <MenuIcon className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{getPageTitle()}</h1>
          </div>
          <Link to="/settings">
            <Avatar src={user?.avatar} name={user?.name || 'S'} className="w-9 h-9" />
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;