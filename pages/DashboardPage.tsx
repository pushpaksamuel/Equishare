import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { calculateBalances } from '../services/analyticsService';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { PlusCircleIcon } from '../components/common/Icons';

const DashboardPage: React.FC = () => {
  const { group, groupMembers, expenses, currencyCode, loading } = useData();
  const balances = calculateBalances(groupMembers, expenses);
  const recentExpenses = expenses.slice(0, 5);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <Button as={Link} to="/expenses/add">
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Add Expense
        </Button>
      </header>
      
      <p className="text-lg text-slate-600 dark:text-slate-400">
        Welcome to your <span className="font-semibold text-primary-600">{group?.name}</span> group.
      </p>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Balances</h2>
        {balances.length > 0 ? (
          <ul className="space-y-2">
            {balances.map(({ member, balance }) => (
              <li key={member.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} />
                  <span className="font-medium">{member.name}</span>
                </div>
                <span className={`font-semibold text-lg ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balance >= 0 ? 'Owed ' : 'Owes '}
                  {formatCurrency(Math.abs(balance), currencyCode)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">No members to show balances for.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
        {recentExpenses.length > 0 ? (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {recentExpenses.map(expense => (
              <li key={expense.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{expense.description}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Paid by {expense.payer.name} on {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="font-semibold text-lg text-slate-700 dark:text-slate-200">
                  {formatCurrency(expense.amount, currencyCode)}
                </div>
              </li>
            ))}
             {expenses.length > 5 && (
              <div className="pt-4 text-center">
                <Button as={Link} to="/expenses" variant="secondary" size="sm">View All Expenses</Button>
              </div>
            )}
          </ul>
        ) : (
          <p className="text-slate-500 text-center py-8">No expenses recorded yet. <Link to="/expenses/add" className="text-primary-600 hover:underline font-medium">Add one!</Link></p>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;