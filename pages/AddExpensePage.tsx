import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { RefreshCwIcon } from '../components/common/Icons';
import { GoogleGenAI, Type } from '@google/genai';

const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { group, groupMembers, categories, currencyCode, currencySymbol, loading } = useData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [payerId, setPayerId] = useState<number | ''>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  } = useExpenseSplit(totalAmount, groupMembers);
  
  const sortedCategories = useMemo(() => [...categories].sort((a,b) => a.name.localeCompare(b.name)), [categories]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsParsing(true);
      try {
        const base64Image = await resizeAndEncodeImage(file);
        setReceiptImage(base64Image);
        
        const base64Data = base64Image.split(',')[1];
        if (!base64Data) {
          throw new Error('Could not extract base64 data from image.');
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const imagePart = {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        };

        const availableCategories = sortedCategories.map(c => c.name).join(', ');
        const textPart = {
          text: `Analyze this receipt image and extract the expense details. The available categories are: ${availableCategories}. The date should be in YYYY-MM-DD format. For any field you cannot determine, use a null value.`,
        };
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "A short description of the expense from the receipt." },
                amount: { type: Type.NUMBER, description: "The total amount of the expense." },
                date: { type: Type.STRING, description: "The date of the expense in YYYY-MM-DD format." },
                category: { type: Type.STRING, description: `The most fitting category from this list: ${availableCategories}` },
              },
            },
          },
        });
        
        const jsonStr = response.text.trim();
        const parsedData = JSON.parse(jsonStr);

        if (parsedData.description) {
          setDescription(parsedData.description);
        }
        if (parsedData.amount) {
          setAmount(parsedData.amount.toString());
        }
        if (parsedData.date) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(parsedData.date)) {
            setDate(parsedData.date);
          }
        }
        if (parsedData.category) {
          const matchedCategory = sortedCategories.find(c => c.name.toLowerCase() === parsedData.category.toLowerCase());
          if (matchedCategory) {
            setCategoryId(matchedCategory.id!);
          }
        }
      } catch (error) {
        console.error("Image processing or analysis failed:", error);
        alert("Failed to process and analyze the receipt image. Please enter the details manually.");
      } finally {
        setIsParsing(false);
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
        const expenseId = await db.expenses.add({
          groupId: group.id!,
          description,
          amount: totalAmount,
          date: new Date(date),
          categoryId: categoryId,
          payerMemberId: payerId,
          receiptImage,
        });

        const allocationsToAdd = finalAllocations.map(alloc => ({
          ...alloc,
          expenseId,
        }));
        await db.allocations.bulkAdd(allocationsToAdd);
      });
      navigate('/expenses');
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('There was an error adding the expense.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!group || groupMembers.length === 0) return <div>Group or members not found. Please set up your group first.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">Add New Expense</h1>
        
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium">Description</label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="e.g., Groceries" />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium">Amount ({currencyCode})</label>
              <Input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium">Date</label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium">Category</label>
              <Select id="category" value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} required>
                <option value="" disabled>Select a category</option>
                {sortedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="payer" className="block text-sm font-medium">Paid by</label>
              <Select id="payer" value={payerId} onChange={e => setPayerId(Number(e.target.value))} required>
                <option value="" disabled>Select who paid</option>
                {groupMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Split Details</h2>
          <div className="flex gap-2 mb-6">
            <Button type="button" size="sm" className="flex-1" variant={splitMethod === 'equally' ? 'primary' : 'secondary'} onClick={() => setSplitMethod('equally')}>Equally</Button>
            <Button type="button" size="sm" className="flex-1" variant={splitMethod === 'custom' ? 'secondary' : 'primary'} onClick={() => setSplitMethod('custom')}>Custom</Button>
          </div>

          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {groupMembers.map(member => {
              const isChecked = involvedMembers.has(member.id!);
              const allocation = allocations.find(a => a.memberId === member.id);
              return (
                <li key={member.id} className="flex items-center gap-3 py-3">
                  <input type="checkbox" checked={isChecked} onChange={() => toggleMemberInvolvement(member.id!)} className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  <Avatar name={member.name} className="w-8 h-8 text-xs" />
                  <span className="flex-1 font-medium">{member.name}</span>
                  {splitMethod === 'custom' ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">{currencyCode === 'USD' ? 'US' : ''}{currencySymbol}</span>
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
                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-28 text-right pr-3">
                      {currencyCode === 'USD' ? 'US' : ''}{formatCurrency((isChecked ? (totalAmount / involvedMembers.size) || 0 : 0), currencyCode)}
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
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={!isValid}>Save Expense</Button>
        </div>
      </form>
    </div>
  );
};

export default AddExpensePage;
