import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useData } from '../hooks/useData';
import { useExpenseSplit } from '../hooks/useExpenseSplit';
import { resizeAndEncodeImage } from '../services/imageService';
import { formatDate, formatCurrency } from '../utils/formatters';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import { ImageIcon } from '../components/common/Icons';
import type { Expense, Allocation } from '../types';

const EditExpensePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const expenseId = Number(id);
  const navigate = useNavigate();

  const expense = useLiveQuery(() => db.expenses.get(expenseId), [expenseId]) as Expense | undefined;
  const expenseAllocations = useLiveQuery(() => db.allocations.where('expenseId').equals(expenseId).toArray(), [expenseId]) as Allocation[] | undefined;
  
  const { group, groupMembers, categories, currencyCode, currencySymbol, loading: dataLoading } = useData();
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
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const encoded = await resizeAndEncodeImage(file);
        setReceiptImage(encoded);
      } catch (error) {
        console.error("Image processing failed:", error);
        alert("Failed to process image.");
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
          categoryId: categoryId,
          payerMemberId: payerId,
          receiptImage,
        });

        // Clear old allocations and add new ones
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Edit Expense</h1>
      
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium">Amount ({currencyCode})</label>
            <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium">Date</label>
            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium">Category</label>
            <Select id="category" value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} required>
              {sortedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="payer" className="block text-sm font-medium">Paid by</label>
            <Select id="payer" value={payerId} onChange={e => setPayerId(Number(e.target.value))} required>
              {groupMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Split Details</h2>
        <div className="flex gap-2 mb-6 border border-slate-200 dark:border-slate-700 rounded-lg p-1 max-w-min">
          <Button type="button" size="sm" className="flex-1" variant={splitMethod === 'equally' ? 'primary' : 'secondary'} onClick={() => setSplitMethod('equally')}>Equally</Button>
          <Button type="button" size="sm" className="flex-1" variant={splitMethod === 'custom' ? 'primary' : 'secondary'} onClick={() => setSplitMethod('custom')}>Custom</Button>
        </div>

        <ul className="space-y-2">
          {groupMembers.map(member => {
            const isChecked = involvedMembers.has(member.id!);
            const allocation = allocations.find(a => a.memberId === member.id);
            return (
               <li key={member.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isChecked ? 'bg-primary-50 dark:bg-primary-500/10' : ''}`}>
                <input type="checkbox" checked={isChecked} onChange={() => toggleMemberInvolvement(member.id!)} className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <Avatar name={member.name} className="w-8 h-8 text-xs" />
                <span className="flex-1 font-medium">{member.name}</span>
                {splitMethod === 'custom' ? (
                  <div className="flex items-center gap-1">
                     <span className="text-slate-500">{currencySymbol}</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-28 text-right"
                      value={isChecked ? allocation?.amount.toFixed(2) : '0.00'}
                      onChange={(e) => updateAllocation(member.id!, e.target.value)}
                      disabled={!isChecked}
                    />
                  </div>
                ) : (
                  <span className="font-mono text-slate-700 dark:text-slate-300 w-28 text-right pr-3">
                    {formatCurrency((isChecked ? (totalAmount / involvedMembers.size) || 0 : 0), currencyCode)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 text-right font-semibold">
          <p className={Math.abs(remainingAmount) < 0.01 ? 'text-green-600' : 'text-red-600'}>
            {remainingAmount.toFixed(2)} remaining
          </p>
        </div>
      </Card>
      
       <Card>
          <h2 className="text-xl font-semibold mb-4">Receipt</h2>
           {receiptImage ? (
                 <div className="relative group">
                    <img src={receiptImage} alt="Receipt preview" className="rounded-lg max-h-60" />
                    <Button variant="danger" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setReceiptImage(undefined)}>Remove</Button>
                </div>
            ) : (
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Upload Receipt
                </Button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="submit" disabled={!isValid}>Update Expense</Button>
      </div>
    </form>
  );
};

export default EditExpensePage;