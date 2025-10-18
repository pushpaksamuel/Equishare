import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatCurrency } from '../utils/formatters';
import CategoryChart from '../components/CategoryChart';
import Card from '../components/common/Card';
import type { ExpenseWithDetails } from '../types';

// A component to render analytics for a given set of expenses
const AnalyticsSection: React.FC<{ expenses: ExpenseWithDetails[]; currencyCode: string; sectionName: string }> = ({ expenses, currencyCode, sectionName }) => {
    
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const spendingByCategory = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Uncategorized';
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = 0;
      }
      categoryMap[categoryName] += expense.amount;
    });
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (expenses.length === 0) {
      return (
          <div className="text-center py-16">
              <h3 className="text-xl font-medium">No expenses in {sectionName}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Add some expenses to see your analytics here.</p>
          </div>
      )
  }

  return (
      <div className="space-y-6">
          <Card>
              <h2 className="text-lg font-semibold text-center mb-2">Total Spent</h2>
              <p className="text-4xl font-bold text-center text-primary-600 dark:text-primary-400">
                  {formatCurrency(totalSpent, currencyCode)}
              </p>
          </Card>

          <Card>
              <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
              <CategoryChart data={spendingByCategory} currencyCode={currencyCode} />
          </Card>
      </div>
  );
};


const AnalyticsPage: React.FC = () => {
  const { 
      groupExpenses,
      familyExpenses,
      individualExpenses,
      currencyCode, 
      loading 
  } = useData();
  const [activeTab, setActiveTab] = useState<'group' | 'family' | 'individual'>('group');

  if (loading) return <div>Loading...</div>;

  const expensesByTab = {
      group: groupExpenses,
      family: familyExpenses,
      individual: individualExpenses,
  };
  
  const sectionNameByTab = {
      group: 'your groups',
      family: 'your family',
      individual: 'your personal space'
  }

  const tabButtonClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1";
  const activeTabClasses = "bg-primary-600 text-white shadow";
  const inactiveTabClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
        <button className={`${tabButtonClasses} ${activeTab === 'group' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('group')}>Group</button>
        <button className={`${tabButtonClasses} ${activeTab === 'family' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('family')}>Family</button>
        <button className={`${tabButtonClasses} ${activeTab === 'individual' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('individual')}>Individual</button>
      </div>

      <AnalyticsSection 
        expenses={expensesByTab[activeTab]} 
        currencyCode={currencyCode}
        sectionName={sectionNameByTab[activeTab]}
      />
    </div>
  );
};

export default AnalyticsPage;