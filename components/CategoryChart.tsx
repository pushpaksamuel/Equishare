import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/formatters';

// FIX: Using any[] to bypass a common recharts typing issue where its internal
// types are stricter than what is passed, causing a compilation error.
interface CategoryChartProps {
  data: any[];
  currencyCode: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#00E396'];

const CategoryChart: React.FC<CategoryChartProps> = ({ data, currencyCode }) => {
  if (!data || data.length === 0) {
    return (
        <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500">No expense data available.</p>
        </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          {/* FIX: Explicitly convert value to Number to ensure toFixed works correctly with the `any` type. */}
          <Tooltip formatter={(value: any) => formatCurrency(Number(value), currencyCode)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;