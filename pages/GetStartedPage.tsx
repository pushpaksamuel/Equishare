import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GetStartedPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 3000); // 3-second delay

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-primary-600 mx-auto">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" fillOpacity="0.2"></path>
            <path d="M16.53 8.97a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L10.5 13.94l4.97-4.97a.75.75 0 011.06 0z" fill="currentColor"></path>
        </svg>

        <h1 className="text-4xl font-bold mt-4 text-slate-800 dark:text-slate-100">
          Welcome to EquiShare
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
          Track your expenses
        </p>

        <div className="mt-12">
          <div className="relative w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute h-full bg-primary-600 rounded-full animate-progress"></div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStartedPage;