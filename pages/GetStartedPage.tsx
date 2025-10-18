import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { PlusCircleIcon, UsersIcon } from '../components/common/Icons';

const GetStartedPage: React.FC = () => {
  const { user, loading } = useData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <span className="text-slate-700 dark:text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-xl w-full text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-primary-600 mx-auto">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" fillOpacity="0.2"></path>
            <path d="M16.53 8.97a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L10.5 13.94l4.97-4.97a.75.75 0 011.06 0z" fill="currentColor"></path>
        </svg>

        <h1 className="text-4xl font-bold mt-4 text-slate-800 dark:text-slate-100">
          You're All Set, {user?.name}!
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 mb-8">
          Welcome to EquiShare. Your space is ready. What would you like to do first?
        </p>

        <Card className="text-left !p-8">
          <div className="space-y-6">
            <Link to="/expenses/add" className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 p-3 rounded-lg">
                <PlusCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Add Your First Expense</h3>
                <p className="text-slate-500 dark:text-slate-400">Log a recent purchase to get started.</p>
              </div>
            </Link>
            <Link to="/people" className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-3 rounded-lg">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Manage Members</h3>
                <p className="text-slate-500 dark:text-slate-400">Review or add more people to your group.</p>
              </div>
            </Link>
          </div>
        </Card>

        <div className="mt-8">
            <Button onClick={() => navigate('/dashboard')} size="lg">
                Go to Dashboard
            </Button>
        </div>
      </div>
    </div>
  );
};

export default GetStartedPage;