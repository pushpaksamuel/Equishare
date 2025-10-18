
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/formatters';

// FIX: Using any[] to bypass a common recharts typing issue where its internal
// types are stricter than what is passed, causing a compilation error.
interface CategoryChartProps {
  data: any[];
  currencyCode: string;
  isDonut?: boolean;
  showLegend?: boolean;
}

const COLORS = ['#6366f1', '#a5b4fc', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];

const CategoryChart: React.FC<CategoryChartProps> = ({ data, currencyCode, isDonut = false, showLegend = true }) => {
  if (!data || data.length === 0) {
    return (
        <div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-slate-500">No expense data available.</p>
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
            outerRadius={100}
            innerRadius={isDonut ? '60%' : '0%'}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            paddingAngle={isDonut && data.length > 1 ? 2 : 0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          {/* FIX: Explicitly convert value to Number to ensure toFixed works correctly with the `any` type. */}
          <Tooltip formatter={(value: any) => formatCurrency(Number(value), currencyCode)} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryChart;