import React, { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatCurrency } from '../utils/formatters';
import CategoryChart from '../components/CategoryChart';
import Card from '../components/common/Card';

const AnalyticsPage: React.FC = () => {
  const { expenses, currencyCode, loading } = useData();

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
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
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

export default AnalyticsPage;
