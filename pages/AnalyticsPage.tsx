import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/formatters';
import CategoryChart from '../components/CategoryChart';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import type { ExpenseWithDetails, Member } from '../types';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Select from '../components/common/Select';

// A component to render analytics for a given set of expenses
const AnalyticsSection: React.FC<{ expenses: ExpenseWithDetails[]; currencyCode: string; sectionName: string; members: Member[]; isFiltered: boolean }> = ({ expenses, currencyCode, sectionName, members, isFiltered }) => {
    
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
              <h3 className="text-xl font-medium">{isFiltered ? `No expenses in ${sectionName} for the selected period` : `No expenses in ${sectionName}`}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{isFiltered ? "Try adjusting the date filter." : "Add some expenses to see your analytics here."}</p>
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

const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
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

  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const allCurrentExpenses = useMemo(() => {
    const expensesByTab = {
        group: groupExpenses,
        family: familyExpenses,
        individual: individualExpenses,
    };
    return expensesByTab[activeTab];
  }, [activeTab, groupExpenses, familyExpenses, individualExpenses]);
  
  const availableMonths = useMemo(() => {
        const months = new Set<string>();
        allCurrentExpenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });
        return Array.from(months).sort((a,b) => b.localeCompare(a));
    }, [allCurrentExpenses]);

  const filteredExpenses = useMemo(() => {
    return allCurrentExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);

        if (selectedMonth) {
            const expenseMonthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
            return expenseMonthKey === selectedMonth;
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0,0,0,0);
            const end = new Date(endDate);
            end.setHours(23,59,59,999);
            return expenseDate >= start && expenseDate <= end;
        }
        return true;
    });
  }, [allCurrentExpenses, selectedMonth, startDate, endDate]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedMonth(e.target.value);
      setStartDate('');
      setEndDate('');
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setStartDate(e.target.value);
      if(e.target.value) setSelectedMonth('');
  }
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEndDate(e.target.value);
      if(e.target.value) setSelectedMonth('');
  }

  const clearFilters = () => {
      setSelectedMonth('');
      setStartDate('');
      setEndDate('');
  };
  
  const isFiltered = !!selectedMonth || (!!startDate && !!endDate);

  if (loading) return <div>Loading...</div>;

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

        <Card>
            <h2 className="text-xl font-semibold mb-4">Filter by Date</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">By Month</label>
                    <Select id="month-select" value={selectedMonth} onChange={handleMonthChange}>
                        <option value="">All Time</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{formatMonthKey(month)}</option>
                        ))}
                    </Select>
                </div>
                 <div className="text-center text-sm font-semibold text-slate-500 my-2 md:my-0">OR</div>
                
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">From</label>
                        <Input id="start-date" type="date" value={startDate} onChange={handleStartDateChange} max={endDate || formatDate(new Date())} />
                    </div>
                     <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">To</label>
                        <Input id="end-date" type="date" value={endDate} onChange={handleEndDateChange} min={startDate} max={formatDate(new Date())} />
                    </div>
                </div>
            </div>
             {isFiltered && (
                <div className="mt-4 flex justify-end">
                    <Button variant="secondary" onClick={clearFilters}>Clear Filter</Button>
                </div>
            )}
        </Card>
      
      <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
        <button className={`${tabButtonClasses} ${activeTab === 'group' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('group')}>Group</button>
        <button className={`${tabButtonClasses} ${activeTab === 'family' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('family')}>Family</button>
        <button className={`${tabButtonClasses} ${activeTab === 'individual' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('individual')}>Individual</button>
      </div>

      <AnalyticsSection 
        expenses={filteredExpenses} 
        members={membersByTab[activeTab]}
        currencyCode={currencyCode}
        sectionName={sectionNameByTab[activeTab]}
        isFiltered={isFiltered}
      />
    </div>
  );
};

export default AnalyticsPage;