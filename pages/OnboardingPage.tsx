import React, { useState } from 'react';
import { db } from '../db';
import { CURRENCIES } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import { Trash2Icon } from '../components/common/Icons';

const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [memberNames, setMemberNames] = useState(['', '']);

  const handleMemberNameChange = (index: number, value: string) => {
    const newNames = [...memberNames];
    newNames[index] = value;
    setMemberNames(newNames);
  };

  const addMemberInput = () => {
    setMemberNames([...memberNames, '']);
  };

  const removeMemberInput = (index: number) => {
    if (memberNames.length > 2) {
      const newNames = memberNames.filter((_, i) => i !== index);
      setMemberNames(newNames);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || memberNames.some(name => !name.trim())) {
      alert('Please fill in all fields.');
      return;
    }
    
    try {
      await db.transaction('rw', db.groups, db.members, db.settings, async () => {
        // Create Group
        const groupId = await db.groups.add({ name: groupName.trim(), currency });
        
        // Add Members
        const membersToAdd = memberNames
          .map(name => name.trim())
          .filter(name => name)
          .map(name => ({ groupId, name }));
          
        await db.members.bulkAdd(membersToAdd);
        
        // Mark onboarding as complete
        await db.settings.put({ id: 'onboarded', value: true });
        await db.settings.put({ id: 'currency', value: currency });
      });

      window.location.reload(); // Easiest way to re-trigger routing logic in App.tsx

    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('There was an error during setup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-600 dark:text-primary-400">Welcome to EquiShare!</h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">Let's get your first group set up.</p>

        <form onSubmit={handleFinish}>
          {step === 1 && (
            <Card className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Step 1: Your Group</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Group Name</label>
                  <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} required placeholder="e.g., Apartment Roomies" />
                </div>
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Default Currency</label>
                  <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                  </Select>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button type="button" onClick={() => setStep(2)} disabled={!groupName.trim()}>Next Step</Button>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Step 2: Add Members</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {memberNames.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => handleMemberNameChange(index, e.target.value)}
                      placeholder={`Member ${index + 1} Name`}
                      required
                    />
                    {memberNames.length > 2 && (
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
              <div className="mt-8 flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit">Finish Setup</Button>
              </div>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;