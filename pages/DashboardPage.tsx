// FIX: Restored correct file content.
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { calculateBalances } from '../services/analyticsService';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import CategoryChart from '../components/CategoryChart';
import { 
    PlusCircleIcon, DollarSignIcon, UsersIcon, TrendingUpIcon, 
    ChevronDownIcon, ReceiptIcon, ShoppingCartIcon, ZapIcon,
    CameraIcon, Edit3Icon, RefreshCwIcon 
} from '../components/common/Icons';

const COLORS = ['#6366f1', '#a5b4fc', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];

const DashboardPage: React.FC = () => {
  const { user, group, groupMembers, expenses, currencyCode, loading } = useData();
  const recentExpenses = expenses.slice(0, 3);
  
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    const totalSpentMonth = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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

    const balances = calculateBalances(groupMembers, expenses);
    const userMember = groupMembers.find(m => m.name === user?.name);
    const userBalance = balances.find(b => b.member.id === userMember?.id)?.balance || 0;
    
    const peopleWhoOweUser = balances.filter(b => {
        // Find who owes money to the user. This is complex.
        // Simplified: if user has a positive balance, count people with negative balances.
        return userBalance > 0 && b.balance < 0 && b.member.id !== userMember?.id;
    });

    return {
        totalSpentMonth,
        biggestCategory,
        spendingByCategory: categoryData,
        userOwed: userBalance > 0 ? userBalance : 0,
        peopleWhoOweUser: peopleWhoOweUser.length,
    }

  }, [expenses, groupMembers, user]);

  const categoryIcons: { [key: string]: React.FC<any> } = {
      'Rent': ReceiptIcon,
      'Groceries': ShoppingCartIcon,
      'Utilities': ZapIcon,
      'Default': DollarSignIcon,
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;
  if (!group) return <div>Group not found.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <button className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{group?.name}</span>
                <ChevronDownIcon className="w-5 h-5 text-slate-500" />
            </button>
        </div>
        <div className="flex items-center gap-4">
             <Button as={Link} to="/expenses/add">
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add Expense
            </Button>
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="flex items-start justify-between">
              <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Spent (Month)</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(analytics.totalSpentMonth, currencyCode)}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">+12% from last month</p>
              </div>
              <div className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 p-3 rounded-lg">
                  <DollarSignIcon className="w-6 h-6" />
              </div>
          </Card>
           <Card className="flex items-start justify-between">
              <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">You're Owed</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(analytics.userOwed, currencyCode)}</p>
                  {analytics.peopleWhoOweUser > 0 && <p className="text-sm text-slate-500 mt-1">from {analytics.peopleWhoOweUser} {analytics.peopleWhoOweUser === 1 ? 'person' : 'people'}</p>}
              </div>
              <div className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-3 rounded-lg">
                  <UsersIcon className="w-6 h-6" />
              </div>
          </Card>
           <Card className="flex items-start justify-between">
              <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Biggest Category</p>
                  <p className="text-3xl font-bold mt-2">{analytics.biggestCategory?.name || 'N/A'}</p>
                   {analytics.biggestCategory && analytics.totalSpentMonth > 0 && (
                        <p className="text-sm text-slate-500 mt-1">
                            {((analytics.biggestCategory.value / analytics.totalSpentMonth) * 100).toFixed(0)}% of total
                        </p>
                   )}
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-3 rounded-lg">
                  <TrendingUpIcon className="w-6 h-6" />
              </div>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Expenses */}
        <div className="lg:col-span-3">
             <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Recent Expenses</h2>
             <Card>
                {recentExpenses.length > 0 ? (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {recentExpenses.map(expense => {
                            const Icon = categoryIcons[expense.category.name] || categoryIcons.Default;
                            return (
                                <li key={expense.id} className="py-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                                            <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{expense.description}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                <span>Paid by {expense.payer.name}</span>
                                                {expense.category.name === 'Rent' && 
                                                    <>
                                                        <span className="text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">Fixed</span>
                                                        <span className="text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 px-2 py-0.5 rounded-full">Recurring</span>
                                                    </>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <p className="font-bold text-lg">{formatCurrency(expense.amount, currencyCode)}</p>
                                </li>
                            )
                        })}
                        <div className="pt-4 text-center">
                            <Button as={Link} to="/expenses" variant="secondary" size="sm">View all expenses</Button>
                        </div>
                    </ul>
                ) : (
                    <p className="text-slate-500 text-center py-8">No expenses this month.</p>
                )}
             </Card>
        </div>

        {/* Spending Analytics */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Spending Analytics</h2>
            <Card>
                <CategoryChart data={analytics.spendingByCategory} currencyCode={currencyCode} isDonut={true} showLegend={false} />
                <div className="mt-4 space-y-2">
                    {analytics.spendingByCategory.slice(0, 5).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span>{item.name}</span>
                            </div>
                            <div className="font-medium">
                                <span>{formatCurrency(item.value, currencyCode)}</span>
                                {analytics.totalSpentMonth > 0 && <span className="ml-2 text-slate-500">{((item.value / analytics.totalSpentMonth) * 100).toFixed(0)}%</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>

       {/* Quick Actions */}
       <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card as={Link} to="/expenses/add" className="text-center hover:border-primary-500 border-2 border-transparent transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                       <CameraIcon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3">Add Receipt</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Scan with your camera</p>
                </Card>
                 <Card as={Link} to="/expenses/add" className="text-center hover:border-primary-500 border-2 border-transparent transition-colors">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mx-auto flex items-center justify-center">
                       <Edit3Icon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3">Manual Entry</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add expense details</p>
                </Card>
                 <Card as={Link} to="#" className="text-center hover:border-primary-500 border-2 border-transparent transition-colors opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center">
                       <RefreshCwIcon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3">Recurring Bill</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Set up auto payments</p>
                </Card>
                 <Card as={Link} to="#" className="text-center hover:border-primary-500 border-2 border-transparent transition-colors opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                       <UsersIcon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold mt-3">Settle Up</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Clear balances now</p>
                </Card>
            </div>
       </div>

    </div>
  );
};

export default DashboardPage;