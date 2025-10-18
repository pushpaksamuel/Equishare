import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 p-3 mx-auto bg-primary-600 rounded-2xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M18,2H6C4.89,2 4,2.89 4,4V18C4,19.11 4.89,20 6,20H18C19.11,20 20,19.11 20,18V4C20,2.89 19.11,2 18,2M12,5L18,9H6L12,5M13.5,13H13V11.5H11V13H10.5C9.67,13 9,13.67 9,14.5C9,15.33 9.67,16 10.5,16H11V17.5H13V16H13.5C14.33,16 15,15.33 15,14.5C15,13.67 14.33,13 13.5,13Z" />
          </svg>
        </div>

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