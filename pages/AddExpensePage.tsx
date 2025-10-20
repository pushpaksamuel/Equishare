// FIX: Restored correct file content.
import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { useData } from '../hooks/useData';
import { useExpenseSplit } from '../hooks/useExpenseSplit';
import { formatDate } from '../utils/formatters';
import { resizeAndEncodeImage } from '../services/imageService';
import { CURRENCIES } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import { ImageIcon, Trash2Icon } from '../components/common/Icons';

const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { allGroups, allMembers, categories, loading } = useData();
  
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [payerId, setPayerId] = useState<number | ''>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedGroup = useMemo(() => allGroups.find(g => g.id === selectedGroupId), [allGroups, selectedGroupId]);
  const membersOfSelectedGroup = useMemo(() => allMembers.filter(m => m.groupId === selectedGroupId), [allMembers, selectedGroupId]);
  const currencySymbol = useMemo(() => {
      if (!selectedGroup) return '$';
      return CURRENCIES.find(c => c.code === selectedGroup.currency)?.symbol || '$';
  }, [selectedGroup]);

  const totalAmount = parseFloat(amount) || 0;
  const {
    splitMethod,
    setSplitMethod,
    allocations,
    updateAllocation,
    involvedMembers,
    toggleMemberInvolvement,
    remainingAmount,
    isValid,
    finalAllocations
  } = useExpenseSplit(totalAmount, membersOfSelectedGroup);
  
  const sortedCategories = useMemo(() => [...categories].sort((a,b) => a.name.localeCompare(b.name)), [categories]);
  
  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64Image = await resizeAndEncodeImage(file);
        setReceiptImage(base64Image);
      } catch (error) {
        console.error("Failed to process image:", error);
        alert("There was an error processing the image. Please try another file.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !isValid || !payerId || !categoryId || !description.trim()) {
      alert('Please fill out all required fields and ensure the split is correct.');
      return;
    }
    
    setIsSaving(true);
    let success = false;
    try {
      await db.transaction('rw', db.expenses, db.allocations, async () => {
        const expenseId = await db.expenses.add({
          groupId: selectedGroup.id!,
          description,
          amount: totalAmount,
          date: new Date(date),
          categoryId: Number(categoryId),
          payerMemberId: Number(payerId),
          receiptImage,
        });

        const allocationsToAdd = finalAllocations.map(alloc => ({
          ...alloc,
          expenseId,
        }));
        await db.allocations.bulkAdd(allocationsToAdd);
      });
      success = true;
    } catch (error) {
      success = false;
      console.error('Failed to add expense:', error);
      alert('There was an error adding the expense.');
    } finally {
      setIsSaving(false);
      if (success) {
        navigate('/dashboard');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (allGroups.length === 0) return <div>No groups found. Please create a group first in Settings.</div>;
  
  const remainingAmountIsZero = Math.abs(remainingAmount) < 0.01;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="group" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Group</label>
              <Select id="group" value={selectedGroupId} onChange={e => { setSelectedGroupId(Number(e.target.value)); setPayerId(''); }} required>
                <option value="" disabled>Select a group</option>
                {allGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="e.g., Dinner with friends" />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount ({currencySymbol})</label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <Select id="category" value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} required>
                <option value="" disabled>Select a category</option>
                {sortedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="payer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Paid by</label>
              <Select id="payer" value={payerId} onChange={e => setPayerId(Number(e.target.value))} required disabled={!selectedGroupId}>
                <option value="" disabled>Select who paid</option>
                {membersOfSelectedGroup.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            </div>
          </div>
        </Card>

        {selectedGroupId && membersOfSelectedGroup.length > 0 && (
          <Card>
              <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Split Details</h2>
              <div className="flex items-center gap-2 mb-6 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg w-48">
                  <button type="button" className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all duration-200 ${splitMethod === 'equally' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow' : 'text-slate-600 dark:text-slate-300'}`} onClick={() => setSplitMethod('equally')}>Equally</button>
                  <button type="button" className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all duration-200 ${splitMethod === 'custom' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow' : 'text-slate-600 dark:text-slate-300'}`} onClick={() => setSplitMethod('custom')}>Custom</button>
              </div>

              <ul className="space-y-3">
                  {membersOfSelectedGroup.map(member => {
                      const isChecked = involvedMembers.has(member.id!);
                      const allocation = allocations.find(a => a.memberId === member.id);
                      const memberShare = isChecked && splitMethod === 'equally' ? (totalAmount / involvedMembers.size) || 0 : 0;
                      
                      return (
                          <li key={member.id} className="flex items-center gap-4 p-2 rounded-lg">
                              <input type="checkbox" checked={isChecked} onChange={() => toggleMemberInvolvement(member.id!)} className="h-5 w-5 rounded border-slate-400 dark:border-slate-500 text-primary-600 focus:ring-primary-500 bg-transparent dark:bg-slate-700 checked:bg-primary-600" />
                              <Avatar name={member.name} className="w-9 h-9 text-sm" />
                              <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">{member.name}</span>
                              
                              {splitMethod === 'custom' ? (
                                  <div className="flex items-center gap-2">
                                      <span className="text-slate-500 font-medium">{currencySymbol}</span>
                                      <Input
                                          type="number"
                                          step="0.01"
                                          className="w-32 text-right font-semibold !py-2"
                                          value={isChecked ? allocation?.amount.toFixed(2) : '0.00'}
                                          onChange={(e) => updateAllocation(member.id!, e.target.value)}
                                          onFocus={(e) => e.target.select()}
                                          disabled={!isChecked || totalAmount === 0}
                                      />
                                  </div>
                              ) : (
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 w-32 text-right pr-3">
                                      {currencySymbol}{memberShare.toFixed(2)}
                                  </span>
                              )}
                          </li>
                      );
                  })}
              </ul>
              <div className={`mt-4 text-right font-semibold text-sm pr-3 ${remainingAmountIsZero ? 'text-green-500' : 'text-red-500'}`}>
                {remainingAmount.toFixed(2)} remaining
              </div>
          </Card>
        )}

        <Card>
          <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Receipt</h2>
          {receiptImage ? (
            <div className="relative group">
              <img src={receiptImage} alt="Receipt preview" className="rounded-lg max-h-60 w-auto mx-auto" />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <Button variant="danger" size="sm" onClick={() => setReceiptImage(undefined)}>
                  <Trash2Icon className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleReceiptUpload}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-5 h-5 mr-2" />
                Upload Receipt
              </Button>
            </div>
          )}
        </Card>
        
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={!isValid || isSaving}>
            {isSaving ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddExpensePage;