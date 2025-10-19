import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatCurrency } from '../utils/formatters';
import CategoryChart from '../components/CategoryChart';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import type { ExpenseWithDetails, Member } from '../types';

// A component to render analytics for a given set of expenses
const AnalyticsSection: React.FC<{ expenses: ExpenseWithDetails[]; currencyCode: string; sectionName: string; members: Member[] }> = ({ expenses, currencyCode, sectionName, members }) => {
    
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

  const memberSpending = useMemo(() => {
    if (!members || members.length === 0) return [];
    
    const spendingMap = new Map<number, { member: Member; total: number }>();
    members.forEach(member => {
        spendingMap.set(member.id!, { member, total: 0 });
    });

    expenses.forEach(expense => {
        expense.allocations.forEach(allocation => {
            if (spendingMap.has(allocation.memberId)) {
                const current = spendingMap.get(allocation.memberId)!;
                current.total += allocation.amount;
            }
        });
    });

    return Array.from(spendingMap.values()).sort((a, b) => b.total - a.total);
  }, [expenses, members]);

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
          
          {memberSpending.length > 0 && (
            <Card>
                <h2 className="text-xl font-semibold mb-4">Spending by Member</h2>
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {memberSpending.map(({ member, total }) => (
                        <li key={member.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar name={member.name} />
                                <span className="font-medium text-slate-800 dark:text-slate-100">{member.name}</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(total, currencyCode)}</span>
                        </li>
                    ))}
                </ul>
            </Card>
          )}
      </div>
  );
};


const AnalyticsPage: React.FC = () => {
  const { 
      groupExpenses,
      familyExpenses,
      individualExpenses,
      groupTypeMembers,
      familyMembers,
      individualMembers,
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
  
  const membersByTab = {
    group: groupTypeMembers,
    family: familyMembers,
    individual: individualMembers,
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
        members={membersByTab[activeTab]}
        currencyCode={currencyCode}
        sectionName={sectionNameByTab[activeTab]}
      />
    </div>
  );
};

export default AnalyticsPage;