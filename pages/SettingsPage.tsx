
import React, { useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { exportData, importData } from '../services/backupService';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Reset file input value to allow re-uploading the same file
    if(event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <h1 className="text-3xl font-bold">Settings</h1>
      
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