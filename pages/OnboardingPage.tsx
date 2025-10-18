import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { CURRENCIES } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import { Trash2Icon, UserIcon, UsersIcon, HeartIcon } from '../components/common/Icons';

type UsageType = 'individual' | 'family' | 'group';

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  // Step 1: User info
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userContact, setUserContact] = useState('');
  // Step 2: Usage Type
  const [usageType, setUsageType] = useState<UsageType | null>(null);
  // Step 3: Group info
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [memberNames, setMemberNames] = useState<string[]>(['', '']);

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
        if (!finalGroupName || finalMembers.length < 1) {
            alert('Please fill in all required fields.');
            return;
        }
    }
    
    try {
      await db.transaction('rw', db.users, db.groups, db.members, db.settings, async () => {
        // Add User
        await db.users.add({ name: userName.trim(), email: userEmail.trim(), contactInfo: userContact.trim() });
        
        // Create Group
        const groupId = await db.groups.add({ name: finalGroupName, currency });
        
        // Add Members
        const membersToAdd = finalMembers.map(name => ({ groupId, name }));
        await db.members.bulkAdd(membersToAdd);
        
        // Mark onboarding as complete
        await db.settings.put({ id: 'onboarded', value: true });
        await db.settings.put({ id: 'currency', value: currency });
      });

      window.location.reload();

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
                <label htmlFor="userName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Name</label>
                <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required placeholder="e.g., Jane Doe" />
              </div>
               <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email <span className="text-slate-500">(Optional)</span></label>
                <Input id="userEmail" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="userContact" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Info <span className="text-slate-500">(Optional)</span></label>
                <Input id="userContact" value={userContact} onChange={(e) => setUserContact(e.target.value)} placeholder="Phone number, etc." />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button type="button" onClick={() => setStep(2)} disabled={!userName.trim()}>Next Step</Button>
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
                <div className={`${usageTypeCardClasses} ${usageType === 'individual' ? selectedCardClasses : 'border-slate-300 dark:border-slate-600'}`} onClick={() => setUsageType('individual')}>
                    <UserIcon className="w-10 h-10 mx-auto mb-3 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold">For Myself</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track personal expenses.</p>
                </div>
                <div className={`${usageTypeCardClasses} ${usageType === 'family' ? selectedCardClasses : 'border-slate-300 dark:border-slate-600'}`} onClick={() => setUsageType('family')}>
                    <HeartIcon className="w-10 h-10 mx-auto mb-3 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold">For my Family</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage family budget.</p>
                </div>
                <div className={`${usageTypeCardClasses} ${usageType === 'group' ? selectedCardClasses : 'border-slate-300 dark:border-slate-600'}`} onClick={() => setUsageType('group')}>
                    <UsersIcon className="w-10 h-10 mx-auto mb-3 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-semibold">For a Group</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Split costs with friends.</p>
                </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => setStep(3)} disabled={!usageType}>Next Step</Button>
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
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
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
                <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{usageType === 'family' ? 'Family' : 'Group'} Name</label>
                <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} required placeholder={usageType === 'family' ? 'e.g., The Doe Family' : 'e.g., Apartment Roomies'} />
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
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit" disabled={!groupName.trim() || memberNames.some(n => !n.trim())}>Finish Setup</Button>
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
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-600 dark:text-primary-400">Welcome to EquiShare!</h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          {step < 3 ? "Let's get you set up." : "Just one more step."}
        </p>
        <form onSubmit={handleFinish}>
          {renderStep()}
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;