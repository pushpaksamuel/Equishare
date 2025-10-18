import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { exportData, importData } from '../services/backupService';
import { useData } from '../hooks/useData';
import { db } from '../db';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading } = useData();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userContact, setUserContact] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setUserEmail(user.email || '');
      setUserContact(user.contactInfo || '');
    }
  }, [user]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (window.confirm("Importing will overwrite all existing data. Are you sure you want to continue?")) {
        try {
          await importData(file);
        } catch (error) {
          console.error("Import failed in component:", error);
        }
      }
    }
    if(event.target) {
      event.target.value = '';
    }
  };

  const handleUserInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await db.users.update(user.id!, {
        name: userName,
        email: userEmail,
        contactInfo: userContact,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000); // Reset after 2s
    } catch (error) {
      console.error("Failed to update user info:", error);
      alert("There was an error saving your information.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <h1 className="text-3xl font-bold">Settings</h1>
      
      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">User Information</h2>
        <Card>
          {loading ? (
            <p>Loading user data...</p>
          ) : (
            <form onSubmit={handleUserInfoSave} className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <Input id="userEmail" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="userContact" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label>
                <Input id="userContact" value={userContact} onChange={(e) => setUserContact(e.target.value)} placeholder="e.g., +1 555-123-4567" />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving || saveSuccess}>
                  {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Appearance</h2>
        <Card>
          <div className="flex justify-between items-center">
            <span className="font-medium">Theme</span>
            <Button onClick={toggleTheme} variant="secondary">
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Data Management</h2>
        <Card className="space-y-6">
          <div>
            <h3 className="font-medium text-lg">Export Data</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">Save a backup of all your groups, members, and expenses as a JSON file.</p>
            <Button onClick={exportData} variant="outline">Export Backup</Button>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="font-medium text-lg">Import Data</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">Import data from a backup file. This will replace all current data.</p>
            <Button onClick={handleImportClick} variant="outline">Import Backup</Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        </Card>
      </section>
    </div>
  );
};

export default SettingsPage;
