

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CURRENCIES } from '../constants';
import type { Group, Member, Category, ExpenseWithDetails, Expense, Allocation, User } from '../types';
import { useMemo } from 'react';

export function useData() {
  const user = useLiveQuery(() => db.users.toCollection().first(), []) as User | undefined;
  
  // Fetch all core data
  const allGroups = useLiveQuery(() => db.groups.toArray(), []) as Group[] | undefined;
  const allMembers = useLiveQuery(() => db.members.toArray(), []) as Member[] | undefined;
  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  const allExpenses = useLiveQuery(() => db.expenses.reverse().sortBy('date'), []) as Expense[] | undefined;
  const allAllocations = useLiveQuery(
    () => (allExpenses ? db.allocations.where('expenseId').anyOf(allExpenses.map(e => e.id!)).toArray() : []),
    [allExpenses]
  ) as Allocation[] | undefined;

  // Memoize detailed expense calculations
  const allExpensesWithDetails: ExpenseWithDetails[] | undefined = useMemo(() => {
    if (!allExpenses || !categories || !allMembers || !allAllocations) return undefined;
    
    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    const membersMap = new Map(allMembers.map(m => [m.id, m]));
    
    return allExpenses.map(expense => {
      const expenseAllocations = allAllocations
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
  }, [allExpenses, categories, allMembers, allAllocations]);

  // Create categorized data
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

    if (!allGroups || !allMembers || !allExpensesWithDetails) return result;

    result.individualGroups = allGroups.filter(g => g.type === 'individual');
    result.familyGroups = allGroups.filter(g => g.type === 'family');
    result.groupGroups = allGroups.filter(g => g.type === 'group');

    const individualGroupIds = new Set(result.individualGroups.map(g => g.id));
    const familyGroupIds = new Set(result.familyGroups.map(g => g.id));
    const groupGroupIds = new Set(result.groupGroups.map(g => g.id));
    
    result.individualMembers = allMembers.filter(m => individualGroupIds.has(m.groupId));
    result.familyMembers = allMembers.filter(m => familyGroupIds.has(m.groupId));
    result.groupMembers = allMembers.filter(m => groupGroupIds.has(m.groupId));

    result.individualExpenses = allExpensesWithDetails.filter(e => individualGroupIds.has(e.groupId));
    result.familyExpenses = allExpensesWithDetails.filter(e => familyGroupIds.has(e.groupId));
    result.groupExpenses = allExpensesWithDetails.filter(e => groupGroupIds.has(e.groupId));

    return result;
  }, [allGroups, allMembers, allExpensesWithDetails]);


  // For backward compatibility with pages not yet updated (like Dashboard)
  const group = allGroups?.[0];
   const compatibilityGroupMembers = useMemo(() => {
    if (!group || !allMembers) return [];
    return allMembers.filter(m => m.groupId === group.id);
  }, [group, allMembers]);

  const currencyCode = group?.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';

  const loading = user === undefined || allGroups === undefined || allMembers === undefined || categories === undefined || allExpensesWithDetails === undefined;

  return { 
    user,
    // Raw data
    allGroups: allGroups || [],
    allMembers: allMembers || [],
    categories: categories || [],
    allExpenses: allExpensesWithDetails || [],
    // Categorized Data
    individualGroups, familyGroups, groupGroups,
    individualMembers, familyMembers,
    // FIX: Renamed `groupMembers` to `groupTypeMembers` to avoid conflict with the compatibility `groupMembers` property below.
    groupTypeMembers: groupMembers,
    individualExpenses, familyExpenses, groupExpenses,
    // Compatibility data for Dashboard & old components
    group,
    groupMembers: compatibilityGroupMembers,
    expenses: allExpensesWithDetails || [],
    // currency
    currencyCode,
    currencySymbol,
    loading 
  };
}