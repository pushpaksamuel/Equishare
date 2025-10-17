import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { db } from '../db';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { PlusCircleIcon, EditIcon, Trash2Icon } from '../components/common/Icons';

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
        <Button as={Link} to="/expenses/add">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add Expense
        </Button>
      </div>

      {expenses.length > 0 ? (
        <div className="space-y-4">
          {expenses.map(expense => (
            <Card key={expense.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:shadow-md transition-shadow">
              <div className="flex-1 mb-4 sm:mb-0">
                <div className="flex items-center gap-4">
                  <Avatar name={expense.category.name} className="w-10 h-10 text-xs rounded-lg" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{expense.description}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(expense.date).toLocaleDateString()} &bull; {expense.category.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end sm:flex-row sm:gap-4 sm:items-center">
                <div className="mb-3 sm:mb-0 sm:text-right">
                  <p className="font-semibold text-lg">{formatCurrency(expense.amount, currencyCode)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Paid by {expense.payer.name}</p>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <Button as={Link} to={`/expenses/edit/${expense.id}`} size="icon" variant="secondary">
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handleDeleteExpense(expense.id!)} size="icon" variant="danger">
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <div className="text-center py-16">
              <h3 className="text-xl font-medium">No expenses yet!</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Get started by adding your first expense.</p>
              <Button as={Link} to="/expenses/add" className="mt-6">
                Add Expense
              </Button>
            </div>
        </Card>
      )}
    </div>
  );
};

export default ExpensesPage;
