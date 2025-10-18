import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useData } from '../hooks/useData';
import { useExpenseSplit } from '../hooks/useExpenseSplit';
import { formatDate } from '../utils/formatters';
import { resizeAndEncodeImage } from '../services/imageService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import type { Expense, Allocation } from '../types';
import { ImageIcon, Trash2Icon } from '../components/common/Icons';

const EditExpensePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const expenseId = Number(id);
  const navigate = useNavigate();

  const expense = useLiveQuery(() => db.expenses.get(expenseId), [expenseId]) as Expense | undefined;
  const expenseAllocations = useLiveQuery(() => db.allocations.where('expenseId').equals(expenseId).toArray(), [expenseId]) as Allocation[] | undefined;
  
  const { group, groupMembers, categories, currencySymbol, loading: dataLoading } = useData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [payerId, setPayerId] = useState<number | ''>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialAllocations = useMemo(() => {
    return expenseAllocations?.map(a => ({ memberId: a.memberId, amount: a.amount })) || [];
  }, [expenseAllocations]);

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
  } = useExpenseSplit(totalAmount, groupMembers, initialAllocations);

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setDate(formatDate(new Date(expense.date)));
      setCategoryId(expense.categoryId);
      setPayerId(expense.payerMemberId);
      setReceiptImage(expense.receiptImage);
    }
  }, [expense]);

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
    if (!group || !isValid || !payerId || !categoryId || !description.trim()) {
      alert('Please fill out all required fields and ensure the split is correct.');
      return;
    }

    try {
      await db.transaction('rw', db.expenses, db.allocations, async () => {
        await db.expenses.update(expenseId, {
          description,
          amount: totalAmount,
          date: new Date(date),
          categoryId: Number(categoryId),
          payerMemberId: Number(payerId),
          receiptImage,
        });

        await db.allocations.where('expenseId').equals(expenseId).delete();
        const allocationsToAdd = finalAllocations.map(alloc => ({
          ...alloc,
          expenseId,
        }));
        await db.allocations.bulkAdd(allocationsToAdd);
      });
      navigate('/expenses');
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('There was an error updating the expense.');
    }
  };

  const loading = dataLoading || !expense || !expenseAllocations;
  if (loading) return <div>Loading...</div>;
  if (!group || groupMembers.length === 0) return <div>Group or members not found.</div>;
  
  const remainingAmountIsZero = Math.abs(remainingAmount) < 0.01;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Edit Expense</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <Select id="category" value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} required>
                {sortedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="payer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Paid by</label>
              <Select id="payer" value={payerId} onChange={e => setPayerId(Number(e.target.value))} required>
                {groupMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            </div>
          </div>
        </Card>

        <Card>
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Split Details</h2>
            <div className="flex items-center gap-2 mb-6 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg w-48">
                <button type="button" className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all duration-200 ${splitMethod === 'equally' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow' : 'text-slate-600 dark:text-slate-300'}`} onClick={() => setSplitMethod('equally')}>Equally</button>
                <button type="button" className={`flex-1 p-2 rounded-md text-sm font-semibold transition-all duration-200 ${splitMethod === 'custom' ? 'bg-primary-600 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`} onClick={() => setSplitMethod('custom')}>Custom</button>
            </div>

            <ul className="space-y-3">
                {groupMembers.map(member => {
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
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/expenses')}>Cancel</Button>
          <Button type="submit" disabled={!isValid}>Update Expense</Button>
        </div>
      </form>
    </div>
  );
};

export default EditExpensePage;