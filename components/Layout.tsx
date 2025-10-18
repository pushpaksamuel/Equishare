import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { PlusIcon, MenuIcon, XIcon } from './common/Icons';
import Button from './common/Button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'People', href: '/people' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Settings', href: '/settings' },
];

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary-600">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" fillOpacity="0.2"></path>
                    <path d="M16.53 8.97a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L10.5 13.94l4.97-4.97a.75.75 0 011.06 0z" fill="currentColor"></path>
                  </svg>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">EquiShare</span>
              </Link>
              {/* Desktop Nav */}
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
            <div className="flex items-center gap-2">
              {/* Responsive Add Expense Button */}
              <Button as={Link} to="/expenses/add" className="hidden sm:inline-flex">
                <PlusIcon className="w-5 h-5 mr-1" />
                Add Expense
              </Button>
               <Button as={Link} to="/expenses/add" size="icon" variant="primary" className="sm:hidden">
                <PlusIcon className="w-5 h-5" />
                <span className="sr-only">Add Expense</span>
              </Button>
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button size="icon" variant="secondary" onClick={() => setIsMobileMenuOpen(true)}>
                    <span className="sr-only">Open menu</span>
                    <MenuIcon className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-white dark:bg-slate-900 p-4 transform transition-transform md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
            <span className="text-xl font-bold">Menu</span>
            <Button size="icon" variant="secondary" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="sr-only">Close menu</span>
                <XIcon className="w-6 h-6" />
            </Button>
        </div>
        <nav className="flex flex-col space-y-4">
             {navigation.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                        `text-lg font-medium p-3 rounded-lg ${
                        isActive
                            ? 'bg-primary-100 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`
                    }
                >
                    {item.name}
                </NavLink>
            ))}
        </nav>
      </div>
      
      <main>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
