// FIX: Restored correct file content.
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { exportData, importData } from '../services/backupService';
import { resizeAndEncodeImage } from '../services/imageService';
import { useData } from '../hooks/useData';
import { db } from '../db';
import { CURRENCIES, COUNTRY_CODES } from '../constants';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Avatar from '../components/common/Avatar';
import { LogOutIcon } from '../components/common/Icons';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme, logout } = useAppStore();
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading } = useData();
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currencySetting = useLiveQuery(() => db.settings.get('currency'));
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  
  useEffect(() => {
    if (currencySetting?.value) {
        setDefaultCurrency(currencySetting.value);
    }
  }, [currencySetting]);

  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setUserEmail(user.email || '');
      
      const contact = user.contactInfo || '';
      const matchedCode = COUNTRY_CODES
        .sort((a, b) => b.dial_code.length - a.dial_code.length)
        .find(c => contact.startsWith(c.dial_code));

      if (matchedCode) {
        setCountryCode(matchedCode.dial_code);
        setPhoneNumber(contact.substring(matchedCode.dial_code.length));
      } else {
        setCountryCode('+1'); 
        setPhoneNumber(contact);
      }
    }
  }, [user]);

  const handleCurrencyChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = event.target.value;
    setDefaultCurrency(newCurrency);
    await db.settings.put({ id: 'currency', value: newCurrency });
  };

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    if(event.target) event.target.value = '';
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
        try {
            const base64Image = await resizeAndEncodeImage(file);
            await db.users.update(user.id!, { avatar: base64Image });
        } catch (error) {
            console.error("Failed to process image:", error);
            alert("There was an error updating your avatar.");
        }
    }
    if(event.target) event.target.value = '';
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
        contactInfo: `${countryCode}${phoneNumber.trim()}`,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to update user info:", error);
      alert("There was an error saving your information.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
       <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Profile Picture</h2>
        <Card>
            {loading ? (
                 <p>Loading user data...</p>
            ) : (
                <div className="flex items-center gap-6">
                    <Avatar src={user?.avatar} name={user?.name || ''} className="w-20 h-20 text-3xl" />
                    <div>
                        <Button onClick={() => avatarFileInputRef.current?.click()} variant="secondary">
                            Change Photo
                        </Button>
                        <input type="file" ref={avatarFileInputRef} className="hidden" accept="image/*" onChange={handleAvatarFileChange} />
                        <p className="text-xs text-slate-500 mt-2">Recommended: Square image (JPG, PNG)</p>
                    </div>
                </div>
            )}
        </Card>
      </section>

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
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label>
                 <div className="flex mt-1">
                    <Select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="!mt-0 rounded-r-none w-28"
                        aria-label="Country code"
                    >
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.dial_code}>{c.code} ({c.dial_code})</option>)}
                    </Select>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="555-123-4567"
                        className="!mt-0 rounded-l-none"
                    />
                </div>
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
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Default Currency</h2>
        <Card>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="font-medium">New Group Currency</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set the default currency for any new groups you create.</p>
            </div>
            <Select
              value={defaultCurrency}
              onChange={handleCurrencyChange}
              className="w-full sm:w-auto"
              aria-label="Default currency"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
              ))}
            </Select>
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
              ref={importFileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleImportFileChange}
            />
          </div>
        </Card>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Account</h2>
        <Card>
          <Button onClick={handleLogout} variant="danger" className="w-full sm:w-auto">
            <LogOutIcon className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default SettingsPage;