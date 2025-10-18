import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { db } from '../db';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
// FIX: Imported ChevronDownIcon
import { EditIcon, Trash2Icon, FilterIcon, CalendarIcon, MoreVerticalIcon, ReceiptIcon, ChevronDownIcon } from '../components/common/Icons';
import type { ExpenseWithDetails } from '../types';

// Helper to check for equal split
const isEqualSplit = (expense: ExpenseWithDetails) => {
    if (!expense.allocations || expense.allocations.length < 2) return true;
    const firstAmount = expense.allocations[0].amount;
    return expense.allocations.every(a => Math.abs(a.amount - firstAmount) < 0.01);
};


const ExpensesPage: React.FC = () => {
  const { expenses, currencyCode, loading } = useData();

  const handleDeleteExpense = async (expenseId: number) => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        await db.transaction('rw', db.expenses, db.allocations, async () => {
          await db.allocations.where('expenseId').equals(expenseId).delete();
          await db.expenses.delete(expenseId);
        });
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('There was an error deleting the expense.');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Expenses</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <FilterIcon className="w-4 h-4 mr-2" />
                Filter
            </Button>
            <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                This Month
            </Button>
        </div>
      </div>
      
      <Card className="!p-0">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold">Expense History</h2>
          </div>
          {expenses.length > 0 ? (
            <div>
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {expenses.map(expense => (
                  <li key={expense.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                       <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg flex-shrink-0">
                         <ReceiptIcon className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                       </div>
                       <div className="flex-1">
                           <p className="font-semibold text-slate-800 dark:text-slate-100">{expense.description}</p>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                               Paid by {expense.payer.name} &bull; {isEqualSplit(expense) ? 'Equal split' : 'Custom split'} &bull; {expense.allocations.length} {expense.allocations.length === 1 ? 'person' : 'people'}
                           </p>
                           <div className="mt-2 flex items-center gap-2">
                               <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">Fixed</span>
                               <span className="text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full">Recurring</span>
                           </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        <p className="font-semibold text-lg text-right">{formatCurrency(expense.amount, currencyCode)}</p>
                        <div className="relative">
                           <Button size="icon" variant="secondary" onClick={(e) => {
                                e.currentTarget.nextElementSibling?.classList.toggle('hidden');
                           }}>
                                <MoreVerticalIcon className="w-5 h-5" />
                            </Button>
                            <div className="hidden absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                <Link to={`/expenses/edit/${expense.id}`} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <EditIcon className="w-4 h-4"/> Edit
                                </Link>
                                <button onClick={() => handleDeleteExpense(expense.id!)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <Trash2Icon className="w-4 h-4"/> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="py-4 px-6 text-center border-t border-slate-200 dark:border-slate-700">
                  <button className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                    Load more expenses <ChevronDownIcon className="w-4 h-4"/>
                  </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium">No expenses yet!</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Get started by adding your first expense.</p>
              <Button as={Link} to="/expenses/add" className="mt-6">
                Add Expense
              </Button>
            </div>
          )}
      </Card>
    </div>
  );
};

export default ExpensesPage;