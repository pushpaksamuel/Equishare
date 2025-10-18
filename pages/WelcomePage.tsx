import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import Button from '../components/common/Button';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const onboardedSetting = useLiveQuery(() => db.settings.get('onboarded'));

  const handleLogin = () => {
    // In a real app, this would be a login form.
    // For this local-first app, we check if they've completed onboarding.
    if (onboardedSetting?.value === true) {
      navigate('/dashboard');
    } else {
      // If they click login but haven't onboarded, send them to onboarding.
      navigate('/onboarding');
    }
  };

  const handleSignUp = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-primary-600 mx-auto">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" fillOpacity="0.2"></path>
            <path d="M16.53 8.97a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L10.5 13.94l4.97-4.97a.75.75 0 011.06 0z" fill="currentColor"></path>
        </svg>

        <h1 className="text-4xl font-bold mt-4 text-slate-800 dark:text-slate-100">
          Welcome to EquiShare!
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
          Fair, private, and smart expense tracking — anywhere.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row sm:justify-center gap-4">
          <Button onClick={handleLogin} size="lg" variant="secondary" className="w-full sm:w-auto">
            Login
          </Button>
          <Button onClick={handleSignUp} size="lg" className="w-full sm:w-auto">
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
