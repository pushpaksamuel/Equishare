// Restored file content.
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CURRENCIES } from '../constants';
import type { Group, Member, Category, ExpenseWithDetails, Expense, Allocation, User } from '../types';
import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getRate } from '../services/currencyService';


export function useData() {
  const { displayCurrency } = useAppStore();
  const user = useLiveQuery(() => db.users.toCollection().first(), []) as User | undefined;
  
  // Fetch all core data (original values)
  const allGroups = useLiveQuery(() => db.groups.toArray(), []) as Group[] | undefined;
  const allMembersQuery = useLiveQuery(() => db.members.toArray(), []) as Member[] | undefined;
  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const allOriginalExpenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), []) as Expense[] | undefined;
  const allOriginalAllocations = useLiveQuery(
    () => (allOriginalExpenses ? db.allocations.where('expenseId').anyOf(allOriginalExpenses.map(e => e.id!)).toArray() : []),
    [allOriginalExpenses]
  ) as Allocation[] | undefined;
  
  const allMembers = useMemo(() => allMembersQuery || [], [allMembersQuery]);

  // Memoize detailed expense calculations with original values
  const allExpensesWithDetails_Original: ExpenseWithDetails[] | undefined = useMemo(() => {
    if (!allOriginalExpenses || !categories || !allMembers || !allOriginalAllocations) return undefined;
    
    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    const membersMap = new Map(allMembers.map(m => [m.id, m]));
    
    return allOriginalExpenses.map(expense => {
      const expenseAllocations = allOriginalAllocations
        .filter(a => a.expenseId === expense.id)
        .map(a => ({ ...a, member: membersMap.get(a.memberId)! }))
        .filter(a => a.member);

      return {
        ...expense,
        category: categoriesMap.get(expense.categoryId)!,
        payer: membersMap.get(expense.payerMemberId)!,
        allocations: expenseAllocations,
      };
    }).filter(e => e.payer && e.category);
  }, [allOriginalExpenses, categories, allMembers, allOriginalAllocations]);

  // State for converted expenses and loading status
  const [processedExpenses, setProcessedExpenses] = useState<ExpenseWithDetails[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  // Effect for currency conversion
  useEffect(() => {
    if (!allExpensesWithDetails_Original || !displayCurrency || !allGroups) {
      setProcessedExpenses(allExpensesWithDetails_Original || []);
      return;
    }

    const convertAllExpenses = async () => {
      setIsConverting(true);
      
      const groupCurrencyMap = new Map(allGroups.map(g => [g.id!, g.currency]));
      
      const uniqueSourceCurrencies = [...new Set(allExpensesWithDetails_Original.map(exp => groupCurrencyMap.get(exp.groupId)).filter(Boolean))] as string[];

      const ratePromises = uniqueSourceCurrencies.map(fromCurrency => getRate(fromCurrency, displayCurrency));
      
      try {
        const rates = await Promise.all(ratePromises);
        const rateMap = new Map<string, number>();
        uniqueSourceCurrencies.forEach((currency, index) => {
          rateMap.set(currency, rates[index]);
        });

        const newProcessedExpenses = allExpensesWithDetails_Original.map(expense => {
          const fromCurrency = groupCurrencyMap.get(expense.groupId);
          if (!fromCurrency) {
            return expense; // Should not happen
          }
          const rate = rateMap.get(fromCurrency) || 1;
          
          if (Math.abs(rate - 1) < 0.0001) return expense; // No conversion needed

          return {
            ...expense,
            amount: expense.amount * rate,
            allocations: expense.allocations.map(alloc => ({
              ...alloc,
              amount: alloc.amount * rate,
            })),
          };
        });
        setProcessedExpenses(newProcessedExpenses);
      } catch (error) {
        console.error("Currency conversion failed during processing. Falling back to original values.", error);
        setProcessedExpenses(allExpensesWithDetails_Original);
      } finally {
        setIsConverting(false);
      }
    };

    convertAllExpenses();

  }, [allExpensesWithDetails_Original, displayCurrency, allGroups]);


  // Create categorized data based on processed (converted) expenses
  const { 
    individualGroups, familyGroups, groupGroups,
    individualMembers, familyMembers, groupMembers,
    individualExpenses, familyExpenses, groupExpenses
  } = useMemo(() => {
    const result = {
      individualGroups: [] as Group[], familyGroups: [] as Group[], groupGroups: [] as Group[],
      individualMembers: [] as Member[], familyMembers: [] as Member[], groupMembers: [] as Member[],
      individualExpenses: [] as ExpenseWithDetails[], familyExpenses: [] as ExpenseWithDetails[], groupExpenses: [] as ExpenseWithDetails[],
    };

    if (!allGroups || !allMembers || !processedExpenses) return result;

    result.individualGroups = allGroups.filter(g => g.type === 'individual');
    result.familyGroups = allGroups.filter(g => g.type === 'family');
    result.groupGroups = allGroups.filter(g => g.type === 'group');

    const individualGroupIds = new Set(result.individualGroups.map(g => g.id));
    const familyGroupIds = new Set(result.familyGroups.map(g => g.id));
    const groupGroupIds = new Set(result.groupGroups.map(g => g.id));
    
    result.individualMembers = allMembers.filter(m => individualGroupIds.has(m.groupId));
    result.familyMembers = allMembers.filter(m => familyGroupIds.has(m.groupId));
    result.groupMembers = allMembers.filter(m => groupGroupIds.has(m.groupId));

    result.individualExpenses = processedExpenses.filter(e => individualGroupIds.has(e.groupId));
    result.familyExpenses = processedExpenses.filter(e => familyGroupIds.has(e.groupId));
    result.groupExpenses = processedExpenses.filter(e => groupGroupIds.has(e.groupId));

    return result;
  }, [allGroups, allMembers, processedExpenses]);


  const group = allGroups?.[0];
   const compatibilityGroupMembers = useMemo(() => {
    if (!group || !allMembers) return [];
    return allMembers.filter(m => m.groupId === group.id);
  }, [group, allMembers]);

  const currencySymbol = CURRENCIES.find(c => c.code === displayCurrency)?.symbol || '$';

  const loading = user === undefined || allGroups === undefined || allMembersQuery === undefined || categories === undefined || allExpensesWithDetails_Original === undefined || isConverting;

  return { 
    user,
    allGroups: allGroups || [],
    allMembers: allMembers,
    categories: categories || [],
    allExpenses: processedExpenses,
    individualGroups, familyGroups, groupGroups,
    individualMembers, familyMembers,
    groupTypeMembers: groupMembers,
    individualExpenses, familyExpenses, groupExpenses,
    group,
    groupMembers: compatibilityGroupMembers,
    expenses: processedExpenses,
    currencyCode: displayCurrency,
    currencySymbol,
    loading 
  };
}