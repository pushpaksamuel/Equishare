
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { CURRENCIES } from '../constants';
import type { Group, Member, Category, ExpenseWithDetails, Expense, Allocation, User } from '../types';

export function useData() {
  const groups = useLiveQuery(() => db.groups.toArray(), []) as Group[] | undefined;
  const group = groups?.[0]; // Assuming single group for now
  
  const user = useLiveQuery(() => db.users.toCollection().first(), []) as User | undefined;

  const groupMembers = useLiveQuery(
    () => (group ? db.members.where('groupId').equals(group.id!).toArray() : []),
    [group?.id]
  ) as Member[] | undefined;

  const categories = useLiveQuery(() => db.categories.toArray(), []) as Category[] | undefined;
  
  const expenses = useLiveQuery(
      () => (group ? db.expenses.where('groupId').equals(group.id!).reverse().sortBy('date') : []),
      [group?.id]
  ) as Expense[] | undefined;

  const allocations = useLiveQuery(
    () => (expenses ? db.allocations.where('expenseId').anyOf(expenses.map(e => e.id!)).toArray() : []),
    [expenses]
  ) as Allocation[] | undefined;

  const currencyCode = group?.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';

  const expensesWithDetails: ExpenseWithDetails[] | undefined = useLiveQuery(() => {
    if (!expenses || !categories || !groupMembers || !allocations) return undefined;
    
    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    const membersMap = new Map(groupMembers.map(m => [m.id, m]));
    
    return expenses.map(expense => {
      const expenseAllocations = allocations
        .filter(a => a.expenseId === expense.id)
        .map(a => ({
          ...a,
          member: membersMap.get(a.memberId)!,
        }))
        .filter(a => a.member); // Filter out allocations for members who might have been deleted

      return {
        ...expense,
        category: categoriesMap.get(expense.categoryId)!,
        payer: membersMap.get(expense.payerMemberId)!,
        allocations: expenseAllocations,
      };
    }).filter(e => e.payer && e.category); // Filter out expenses with missing payer or category
  }, [expenses, categories, groupMembers, allocations]);

  // FIX: The original loading logic was incorrect. `!group` would be true if `groups` loaded as an empty array,
  // causing an infinite loading state. This now correctly checks if the initial data queries are unresolved.
  const loading = user === undefined || groups === undefined || groupMembers === undefined || categories === undefined || expensesWithDetails === undefined;

  return { 
    user,
    group,
    groupMembers: groupMembers || [], 
    categories: categories || [], 
    expenses: expensesWithDetails || [],
    currencyCode,
    currencySymbol,
    loading 
  };
}