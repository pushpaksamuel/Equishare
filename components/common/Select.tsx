import React from 'react';
import { ChevronDownIcon } from './Icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select: React.FC<SelectProps> = ({ className = '', children, ...props }) => {
  const baseStyles = 'mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none appearance-none';

  return (
    <div className="relative">
      <select
        className={`${baseStyles} ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
        <ChevronDownIcon className="h-5 w-5" />
      </div>
    </div>
  );
};

export default Select;