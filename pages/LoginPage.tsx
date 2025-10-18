import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../db';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    // NOTE: In a real-world application, you would make an API call to a secure backend.
    // For this local-first demo, we check against the local Dexie database.
    // Storing plain-text passwords is not secure and should be replaced with a proper
    // authentication service like Firebase Auth in a production environment.
    try {
      const user = await db.users.where('email').equalsIgnoreCase(email).first();
      
      if (user && user.password === password) {
        // Successful login
        login();
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <div className="w-12 h-12 p-2.5 mx-auto bg-primary-600 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18,2H6C4.89,2 4,2.89 4,4V18C4,19.11 4.89,20 6,20H18C19.11,20 20,19.11 20,18V4C20,2.89 19.11,2 18,2M12,5L18,9H6L12,5M13.5,13H13V11.5H11V13H10.5C9.67,13 9,13.67 9,14.5C9,15.33 9.67,16 10.5,16H11V17.5H13V16H13.5C14.33,16 15,15.33 15,14.5C15,13.67 14.33,13 13.5,13Z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-center mt-2 text-slate-800 dark:text-slate-100">Login to EquiShare</h1>
        </div>
        
        <Card>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </Card>
        
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/onboarding" className="font-medium text-primary-600 hover:text-primary-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;