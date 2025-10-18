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
        <div className="w-16 h-16 p-3 mx-auto bg-primary-600 rounded-2xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M18,2H6C4.89,2 4,2.89 4,4V18C4,19.11 4.89,20 6,20H18C19.11,20 20,19.11 20,18V4C20,2.89 19.11,2 18,2M12,5L18,9H6L12,5M13.5,13H13V11.5H11V13H10.5C9.67,13 9,13.67 9,14.5C9,15.33 9.67,16 10.5,16H11V17.5H13V16H13.5C14.33,16 15,15.33 15,14.5C15,13.67 14.33,13 13.5,13Z" />
          </svg>
        </div>

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