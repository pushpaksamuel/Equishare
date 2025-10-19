import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { calculateBalances } from '../services/analyticsService';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CategoryChart from '../components/CategoryChart';
import type { ExpenseWithDetails, Member, User } from '../types';
import { 
    PlusCircleIcon, DollarSignIcon, UsersIcon, TrendingUpIcon, 
    ReceiptIcon, ShoppingCartIcon, ZapIcon,
    CameraIcon, Edit3Icon, RefreshCwIcon 
} from '../components/common/Icons';

interface DashboardContentProps {
  title: string;
  expenses: ExpenseWithDetails[];
  members: Member[];
  user: User | undefined;
  currencyCode: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ title, expenses, members, user, currencyCode }) => {
    const recentExpenses = expenses.slice(0, 5);
  
    const analytics = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const monthlyExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth);
        const lastMonthExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startOfLastMonth && expenseDate <= endOfLastMonth;
        });

        const totalSpentMonth = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalSpentLastMonth = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        let percentageChange = 0;
        if (totalSpentLastMonth > 0) {
            percentageChange = ((totalSpentMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100;
        } else if (totalSpentMonth > 0) {
            percentageChange = 100;
        }

        const spendingByCategory: { [key: string]: { name: string; value: number } } = {};
        monthlyExpenses.forEach(expense => {
            const categoryName = expense.category?.name || 'Uncategorized';
            if (!spendingByCategory[categoryName]) {
                spendingByCategory[categoryName] = { name: categoryName, value: 0 };
            }
            spendingByCategory[categoryName].value += expense.amount;
        });
        
        const categoryData = Object.values(spendingByCategory).sort((a, b) => b.value - a.value);
        const biggestCategory = categoryData[0] || null;

        const balances = calculateBalances(members, expenses);
        const userMember = members.find(m => m.name === user?.name);
        const userBalance = balances.find(b => b.member.id === userMember?.id)?.balance || 0;
        
        return {
            totalSpentMonth,
            percentageChange,
            biggestCategory,
            spendingByCategory: categoryData,
            userOwed: userBalance > 0 ? userBalance : 0,
        }
    }, [expenses, members, user]);

    if (expenses.length === 0) {
        return (
            <div className="text-center py-16 animate-fade-in">
                <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">No expenses in your {title.toLowerCase()} space yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Add your first expense to see your new dashboard.</p>
                <Button as={Link} to="/expenses/add">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Add First Expense
                </Button>
            </div>
        )
    }

    return (
      <div className="space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Spent (Month)</p>
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-lg">
                        <DollarSignIcon className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold mt-2">{formatCurrency(analytics.totalSpentMonth, currencyCode)}</p>
                <p className={`text-sm mt-1 flex items-center gap-1 ${analytics.percentageChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {analytics.percentageChange >= 0 ? '+' : ''}{analytics.percentageChange.toFixed(0)}% from last month
                </p>
            </Card>
            <Card>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">You're Owed</p>
                    <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-2.5 rounded-lg">
                        <UsersIcon className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold mt-2">{formatCurrency(analytics.userOwed, currencyCode)}</p>
                 <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">&nbsp;</p>
            </Card>
            <Card>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Biggest Category</p>
                    <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-2.5 rounded-lg">
                        <TrendingUpIcon className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-3xl font-bold mt-2 truncate">{analytics.biggestCategory?.name || 'N/A'}</p>
                 <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">&nbsp;</p>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Recent Expenses</h2>
                <Card>
                    {recentExpenses.length > 0 ? (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700 -m-6">
                            {recentExpenses.map(expense => (
                                <li key={expense.id} className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
                                            <ReceiptIcon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{expense.description}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Paid by {expense.payer.name}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold">{formatCurrency(expense.amount, currencyCode)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-slate-500 py-8">No expenses this month.</p>
                    )}
                </Card>
            </div>

            <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Spending Analytics</h2>
                <Card>
                    <CategoryChart data={analytics.spendingByCategory} currencyCode={currencyCode} isDonut={true} showLegend={false} />
                </Card>
            </div>
        </div>
        
        <div>
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card as={Link} to="/expenses/add" className="text-center py-4 hover:border-primary-500 border-2 border-transparent transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <CameraIcon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3 text-sm">Add Receipt</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Scan with camera</p>
                </Card>
                <Card as={Link} to="/expenses/add" className="text-center py-4 hover:border-primary-500 border-2 border-transparent transition-colors">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mx-auto flex items-center justify-center">
                        <Edit3Icon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3 text-sm">Manual Entry</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Add expense details</p>
                </Card>
                <Card as={Link} to="#" className="text-center py-4 hover:border-slate-400 border-2 border-transparent transition-colors opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center">
                        <RefreshCwIcon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3 text-sm">Recurring Bill</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Set up auto payments</p>
                </Card>
                <Card as={Link} to="#" className="text-center py-4 hover:border-slate-400 border-2 border-transparent transition-colors opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3 text-sm">Settle Up</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Clear balances now</p>
                </Card>
            </div>
        </div>
      </div>
    );
}


const DashboardPage: React.FC = () => {
  const { 
    user,
    groupTypeMembers, familyMembers, individualMembers,
    groupExpenses, familyExpenses, individualExpenses,
    currencyCode, loading, allExpenses
  } = useData();
  const [activeTab, setActiveTab] = useState<'group' | 'family' | 'individual'>('group');

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  const hasAnyExpense = allExpenses.length > 0;

  if (!hasAnyExpense) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in">
        <Card className="text-center max-w-lg py-12">
          <div className="w-16 h-16 p-3 mx-auto bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
             <ReceiptIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mt-4 text-slate-800 dark:text-slate-100">Welcome to your Dashboard!</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8 max-w-xs mx-auto">
            Let's get started by adding your first expense. It's quick and easy!
          </p>
          <Button as={Link} to="/expenses/add" size="lg">
              <PlusCircleIcon className="w-6 h-6 mr-2" />
              Add Your First Expense
          </Button>
        </Card>
      </div>
    );
  }

  const dataByTab = {
      group: {
          title: 'Group',
          expenses: groupExpenses,
          members: groupTypeMembers,
      },
      family: {
          title: 'Family',
          expenses: familyExpenses,
          members: familyMembers,
      },
      individual: {
          title: 'Individual',
          expenses: individualExpenses,
          members: individualMembers,
      },
  }

  const tabButtonClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1";
  const activeTabClasses = "bg-primary-600 text-white shadow";
  const inactiveTabClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex gap-1 max-w-sm w-full">
            <button className={`${tabButtonClasses} ${activeTab === 'group' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('group')}>Group</button>
            <button className={`${tabButtonClasses} ${activeTab === 'family' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('family')}>Family</button>
            <button className={`${tabButtonClasses} ${activeTab === 'individual' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('individual')}>Individual</button>
        </div>
        <div className="flex items-center gap-4">
             <Button as={Link} to="/expenses/add">
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add Expense
            </Button>
        </div>
      </div>
      
      <DashboardContent
        title={dataByTab[activeTab].title}
        expenses={dataByTab[activeTab].expenses}
        members={dataByTab[activeTab].members}
        user={user}
        currencyCode={currencyCode}
      />
    </div>
  );
};

export default DashboardPage;