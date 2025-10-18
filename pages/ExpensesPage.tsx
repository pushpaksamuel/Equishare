

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { db } from '../db';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { EditIcon, Trash2Icon, MoreVerticalIcon, ReceiptIcon, ChevronDownIcon, FilterIcon, XIcon, ArrowUpDownIcon } from '../components/common/Icons';
import type { ExpenseWithDetails } from '../types';

const isEqualSplit = (expense: ExpenseWithDetails) => {
    if (!expense.allocations || expense.allocations.length < 2) return true;
    const firstAmount = expense.allocations[0].amount;
    return expense.allocations.every(a => Math.abs(a.amount - firstAmount) < 0.01);
};


const ExpenseList = ({ expenses, currencyCode, isFiltered }: { expenses: ExpenseWithDetails[], currencyCode: string, isFiltered: boolean }) => {
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteExpense = (expenseId: number) => {
        setExpenseToDelete(expenseId);
        setDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const confirmDeleteExpense = async () => {
        if (!expenseToDelete) return;
        try {
            await db.transaction('rw', db.expenses, db.allocations, async () => {
                await db.allocations.where('expenseId').equals(expenseToDelete).delete();
                await db.expenses.delete(expenseToDelete);
            });
        } catch (error) {
            console.error('Failed to delete expense:', error);
            alert('There was an error deleting the expense.');
        } finally {
            setExpenseToDelete(null);
            setDeleteModalOpen(false);
        }
    };
    
    if (expenses.length === 0) {
        return (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium">{isFiltered ? "No Expenses Match Filters" : "No expenses here!"}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{isFiltered ? "Try adjusting or clearing your filters to see more." : "Add a new expense to get started."}</p>
              {!isFiltered && (
                <Button as={Link} to="/expenses/add" className="mt-6">
                  Add Expense
                </Button>
              )}
            </div>
        );
    }

    return (
        <div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {expenses.slice(0, visibleCount).map(expense => (
                  <li key={expense.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                       <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg flex-shrink-0">
                         <ReceiptIcon className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{expense.description}</p>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                               Paid by {expense.payer.name} &bull; {isEqualSplit(expense) ? 'Equal split' : 'Custom split'} &bull; {expense.allocations.length} {expense.allocations.length === 1 ? 'person' : 'people'}
                           </p>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        <p className="font-semibold text-lg text-right hidden sm:block">{formatCurrency(expense.amount, currencyCode)}</p>
                        <div className="relative" ref={menuRef}>
                           <Button size="icon" variant="secondary" onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}>
                                <MoreVerticalIcon className="w-5 h-5" />
                            </Button>
                            {openMenuId === expense.id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in" style={{ animationDuration: '150ms'}}>
                                    <Link to={`/expenses/edit/${expense.id}`} onClick={() => setOpenMenuId(null)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-md">
                                        <EditIcon className="w-4 h-4"/> Edit
                                    </Link>
                                    <button onClick={() => handleDeleteExpense(expense.id!)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-md">
                                        <Trash2Icon className="w-4 h-4"/> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                  </li>
                ))}
            </ul>
            {visibleCount < expenses.length && (
                <div className="py-4 px-6 text-center border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => setVisibleCount(prev => prev + 10)} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                      Load more expenses <ChevronDownIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Delete Expense">
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Are you sure you want to delete this expense? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button type="button" variant="danger" onClick={confirmDeleteExpense}>Delete</Button>
                </div>
            </Modal>
        </div>
    );
}

const formatMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

type SortOrder = 'date-desc' | 'amount-desc' | 'amount-asc';

const ExpensesPage: React.FC = () => {
    const { 
        groupExpenses,
        familyExpenses,
        individualExpenses,
        categories,
        currencyCode, 
        loading 
    } = useData();
    const [activeTab, setActiveTab] = useState<'group' | 'family' | 'individual'>('group');
    const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');

    const [isCategoryFilterOpen, setCategoryFilterOpen] = useState(false);
    const [isMonthFilterOpen, setMonthFilterOpen] = useState(false);
    const [isSortFilterOpen, setSortFilterOpen] = useState(false);

    const categoryFilterRef = useRef<HTMLDivElement>(null);
    const monthFilterRef = useRef<HTMLDivElement>(null);
    const sortFilterRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
                setCategoryFilterOpen(false);
            }
            if (monthFilterRef.current && !monthFilterRef.current.contains(event.target as Node)) {
                setMonthFilterOpen(false);
            }
            if (sortFilterRef.current && !sortFilterRef.current.contains(event.target as Node)) {
                setSortFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const expensesByTab = {
        group: groupExpenses,
        family: familyExpenses,
        individual: individualExpenses,
    };
    const currentExpenses = expensesByTab[activeTab];

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        currentExpenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
        });
        return Array.from(months).sort((a,b) => b.localeCompare(a));
    }, [currentExpenses]);
    
    const filteredExpenses = useMemo(() => {
        const filtered = currentExpenses.filter(expense => {
            const categoryMatch = selectedCategories.size === 0 || selectedCategories.has(expense.categoryId);
            const monthMatch = !selectedMonth || (() => {
                const expenseDate = new Date(expense.date);
                const expenseMonthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                return expenseMonthKey === selectedMonth;
            })();
            return categoryMatch && monthMatch;
        });

        return filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'date-desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });
    }, [currentExpenses, selectedCategories, selectedMonth, sortOrder]);

    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) newSet.delete(categoryId);
            else newSet.add(categoryId);
            return newSet;
        });
    };
    
    const handleMonthSelect = (monthKey: string | null) => {
        setSelectedMonth(monthKey);
        setMonthFilterOpen(false);
    };
    
    const handleSortSelect = (order: SortOrder) => {
        setSortOrder(order);
        setSortFilterOpen(false);
    };

    const clearFilters = () => {
        setSelectedCategories(new Set());
        setSelectedMonth(null);
    };

    const isFiltered = selectedCategories.size > 0 || !!selectedMonth;
    const sortLabels: Record<SortOrder, string> = {
        'date-desc': 'Date (Newest)',
        'amount-desc': 'Amount (High-Low)',
        'amount-asc': 'Amount (Low-High)',
    };


    if (loading) return <div>Loading...</div>;

    const tabButtonClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1";
    const activeTabClasses = "bg-primary-600 text-white shadow";
    const inactiveTabClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
    const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Unknown';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h1 className="text-3xl font-bold">All Expenses</h1>
                <div className="flex gap-2 items-center">
                    <div className="relative" ref={categoryFilterRef}>
                        <Button variant="outline" onClick={() => setCategoryFilterOpen(o => !o)}>
                            <FilterIcon className="w-4 h-4 mr-2"/> Category
                        </Button>
                        {isCategoryFilterOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 p-2 max-h-60 overflow-y-auto">
                               {categories.map(cat => (
                                   <label key={cat.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                       <input type="checkbox" checked={selectedCategories.has(cat.id!)} onChange={() => handleCategoryToggle(cat.id!)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                       <span className="text-sm text-slate-700 dark:text-slate-200">{cat.name}</span>
                                   </label>
                               ))}
                            </div>
                        )}
                    </div>
                     <div className="relative" ref={monthFilterRef}>
                        <Button variant="outline" onClick={() => setMonthFilterOpen(o => !o)}>
                           <FilterIcon className="w-4 h-4 mr-2"/> Month
                        </Button>
                        {isMonthFilterOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => handleMonthSelect(null)}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium ${
                                        selectedMonth === null
                                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    All Months
                                </button>
                                {availableMonths.map(month => (
                                    <button key={month} onClick={() => handleMonthSelect(month)} className={`w-full text-left px-4 py-2 text-sm ${selectedMonth === month ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                       {formatMonthKey(month)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative" ref={sortFilterRef}>
                        <Button variant="outline" onClick={() => setSortFilterOpen(o => !o)}>
                            <ArrowUpDownIcon className="w-4 h-4 mr-2"/> Sort
                        </Button>
                        {isSortFilterOpen && (
                             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                <button onClick={() => handleSortSelect('date-desc')} className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'date-desc' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Date (Newest first)</button>
                                <button onClick={() => handleSortSelect('amount-desc')} className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'amount-desc' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Amount (High to low)</button>
                                <button onClick={() => handleSortSelect('amount-asc')} className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'amount-asc' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Amount (Low to high)</button>
                            </div>
                        )}
                    </div>
                    <Button as={Link} to="/expenses/add">Add Expense</Button>
                </div>
            </div>

            {isFiltered && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm font-medium">Active Filters:</span>
                    {selectedMonth && (
                         <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 rounded-full">
                            {formatMonthKey(selectedMonth)}
                            <button onClick={() => setSelectedMonth(null)}><XIcon className="w-3 h-3"/></button>
                        </span>
                    )}
                    {/* FIX: Explicitly type `catId` as `number` to resolve TypeScript inference issue. */}
                    {Array.from(selectedCategories).map((catId: number) => (
                        <span key={catId} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 rounded-full">
                            {getCategoryName(catId)}
                            <button onClick={() => handleCategoryToggle(catId)}><XIcon className="w-3 h-3"/></button>
                        </span>
                    ))}
                    <Button variant="secondary" size="sm" onClick={clearFilters} className="!py-0.5 !px-2 !text-xs ml-auto">Clear All</Button>
                </div>
            )}


            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1">
                <button className={`${tabButtonClasses} ${activeTab === 'group' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('group')}>Group</button>
                <button className={`${tabButtonClasses} ${activeTab === 'family' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('family')}>Family</button>
                <button className={`${tabButtonClasses} ${activeTab === 'individual' ? activeTabClasses : inactiveTabClasses}`} onClick={() => setActiveTab('individual')}>Individual</button>
            </div>
      
            <Card className="!p-0">
                <ExpenseList expenses={filteredExpenses} currencyCode={currencyCode} isFiltered={isFiltered} />
            </Card>
        </div>
    );
};

export default ExpensesPage;