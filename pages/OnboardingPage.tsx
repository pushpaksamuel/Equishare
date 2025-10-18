
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { CURRENCIES, COUNTRY_CODES } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import { Trash2Icon, UserIcon, UsersIcon, HeartIcon } from '../components/common/Icons';
import { useAppStore } from '../store/useAppStore';

type UsageType = 'individual' | 'family' | 'group';

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { login } = useAppStore();

  // Step 1: User info
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [userContact, setUserContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Step 2: Usage Type
  const [usageType, setUsageType] = useState<UsageType | null>(null);
  // Step 3: Group info
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [memberNames, setMemberNames] = useState<string[]>(['', '']);
  
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  
  const passwordsMatch = password && password === confirmPassword;
  const canGoToStep2 = userName.trim() && userEmail.trim() && userContact.trim() && password && passwordsMatch;
  const canGoToStep3 = !!usageType;
  const canFinishGroupSetup = groupName.trim() && !memberNames.some(n => !n.trim());

  // Pre-fill first member name with user's name
  useEffect(() => {
    setMemberNames(current => {
      const newNames = [...current];
      newNames[0] = userName;
      return newNames;
    });
  }, [userName]);

  const handleMemberNameChange = (index: number, value: string) => {
    const newNames = [...memberNames];
    newNames[index] = value;
    setMemberNames(newNames);
  };

  const addMemberInput = () => {
    setMemberNames([...memberNames, '']);
  };

  const removeMemberInput = (index: number) => {
    // Prevent removing the primary user (self)
    if (memberNames.length > 1 && index > 0) {
      const newNames = memberNames.filter((_, i) => i !== index);
      setMemberNames(newNames);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalGroupName: string;
    let finalMembers: string[];

    if (usageType === 'individual') {
        finalGroupName = `${userName.trim()}'s Expenses`;
        finalMembers = [userName.trim()];
    } else {
        finalGroupName = groupName.trim();
        finalMembers = memberNames.map(name => name.trim()).filter(name => name);
        if (!canFinishGroupSetup) {
            alert('Please fill in all required fields.');
            return;
        }
    }
    
    try {
      await db.transaction('rw', db.users, db.groups, db.members, db.settings, async () => {
        // Add User
        await db.users.add({ name: userName.trim(), email: userEmail.trim(), contactInfo: `${countryCode}${userContact.trim()}`, password });
        
        // Create Group
        const groupId = await db.groups.add({ name: finalGroupName, currency, type: usageType! });
        
        // Add Members
        const membersToAdd = finalMembers.map(name => ({ groupId, name }));
        await db.members.bulkAdd(membersToAdd);
        
        // Mark onboarding as complete
        await db.settings.put({ id: 'onboarded', value: true });
        await db.settings.put({ id: 'currency', value: currency });
      });

      // After successful setup, log the user in and navigate to the get-started page
      login();
      navigate('/get-started', { replace: true });

    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('There was an error during setup. Please try again.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Step 1: Your Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Name <span className="text-red-500">*</span></label>
                <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required placeholder="e.g., Jane Doe" autoFocus onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('userEmail')?.focus())}/>
              </div>
               <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email <span className="text-red-500">*</span></label>
                <Input id="userEmail" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="you@example.com" required onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('userContact')?.focus())}/>
              </div>
              <div>
                <label htmlFor="userContact" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number <span className="text-red-500">*</span></label>
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
                        id="userContact"
                        type="tel"
                        value={userContact}
                        onChange={(e) => setUserContact(e.target.value)}
                        placeholder="555-123-4567"
                        required
                        onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('password')?.focus())}
                        className="!mt-0 rounded-l-none"
                    />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter a secure password" onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('confirmPassword')?.focus())} />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password <span className="text-red-500">*</span></label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm your password" onKeyDown={(e) => handleKeyDown(e, () => canGoToStep2 && nextStep())} />
                {password && confirmPassword && !passwordsMatch && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button type="button" onClick={nextStep} disabled={!canGoToStep2}>Next Step</Button>
            </div>
          </Card>
        );
      case 2:
        const usageTypeCardClasses = "border-2 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10";
        const selectedCardClasses = "border-primary-600 bg-primary-50 dark:bg-primary-500/10 ring-2 ring-primary-500";
        return (
          <Card className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Step 2: How will you use EquiShare?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${usageTypeCardClasses} ${usageType === 'individual' ? selectedCardClasses : 'border-slate-300 dark:border-slate-600'}`} onClick={() => { setUsageType('individual'); setTimeout(nextStep, 200); }}>
                    <UserIcon className="w-10 h-10 mx-auto mb-3 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold">For Myself</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track personal expenses.</p>
                </div>
                <div className={`${usageTypeCardClasses} ${usageType === 'family' ? selectedCardClasses : 'border-slate-300 dark:border-slate-600'}`} onClick={() => { setUsageType('family'); setTimeout(nextStep, 200); }}>
                    <HeartIcon className="w-10 h-10 mx-auto mb-3 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold">For my Family</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage family budget.</p>
                </div>
                <div className={`${usageTypeCardClasses} ${usageType === 'group' ? selectedCardClasses : 'border-slate-300 dark:border-slate-600'}`} onClick={() => { setUsageType('group'); setTimeout(nextStep, 200); }}>
                    <UsersIcon className="w-10 h-10 mx-auto mb-3 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold">For a Group</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Split costs with friends.</p>
                </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
              <Button type="button" onClick={nextStep} disabled={!canGoToStep3}>Next Step</Button>
            </div>
          </Card>
        );
      case 3:
        if (usageType === 'individual') {
          return (
             <Card className="animate-fade-in text-center">
              <h2 className="text-xl font-semibold mb-4">All Set, {userName}!</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">We've set up a personal space for you. You can change the currency if needed.</p>
               <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 text-left">Default Currency</label>
                  <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                  </Select>
                </div>
              <div className="mt-8 flex justify-between">
                <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
                <Button type="submit">Finish Setup</Button>
              </div>
            </Card>
          )
        }
        return (
          <Card className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Step 3: Setup your {usageType}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{usageType === 'family' ? 'Family' : 'Group'} Name <span className="text-red-500">*</span></label>
                <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} required placeholder={usageType === 'family' ? 'e.g., The Doe Family' : 'e.g., Apartment Roomies'} autoFocus />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Default Currency</label>
                <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                </Select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{usageType === 'family' ? 'Family' : 'Group'} Members</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {memberNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={name}
                          onChange={(e) => handleMemberNameChange(index, e.target.value)}
                          placeholder={`Member ${index + 1} Name`}
                          required
                          readOnly={index === 0}
                          className={index === 0 ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' : ''}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && index === memberNames.length - 1 && name.trim() !== '') {
                                e.preventDefault();
                                addMemberInput();
                            }
                          }}
                        />
                        {memberNames.length > 1 && index > 0 && (
                          <Button type="button" size="icon" variant="danger" onClick={() => removeMemberInput(index)}>
                            <Trash2Icon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button type="button" variant="outline" onClick={addMemberInput}>Add another member</Button>
                  </div>
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
              <Button type="submit" disabled={!canFinishGroupSetup}>Finish Setup</Button>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
         <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary-600 mx-auto">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" fillOpacity="0.2"></path>
                <path d="M16.53 8.97a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L10.5 13.94l4.97-4.97a.75.75 0 011.06 0z" fill="currentColor"></path>
            </svg>
            <h1 className="text-3xl font-bold text-center mt-2 text-slate-800 dark:text-slate-100">Get Started with EquiShare</h1>
        </div>
        <form onSubmit={handleFinish}>
          {renderStep()}
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;