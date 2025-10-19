import { useState, useEffect, useMemo } from 'react';
import type { Member } from '../types';

export type AllocationInput = {
  memberId: number;
  amount: number;
};

// Helper function to determine if an existing split was equal
const areInitialAllocationsEqual = (allocs: { memberId: number; amount: number }[]): boolean => {
  const involvedAllocs = allocs.filter(a => a.amount > 0.005); // Use a small epsilon
  if (involvedAllocs.length <= 1) return true; // If 0 or 1 person, it's "equal"
  const firstAmount = involvedAllocs[0].amount;
  // Check if all other amounts are close to the first one (handles floating point issues)
  return involvedAllocs.every(a => Math.abs(a.amount - firstAmount) < 0.01);
};


export function useExpenseSplit(
  totalAmount: number,
  allMembers: Member[],
  initialAllocations: { memberId: number; amount: number }[] = []
) {
  const [splitMethod, setSplitMethod] = useState<'equally' | 'custom'>('equally');
  const [involvedMembers, setInvolvedMembers] = useState<Set<number>>(new Set());
  const [allocations, setAllocations] = useState<AllocationInput[]>([]);
  const [isInitialRender, setIsInitialRender] = useState(true);

  // Effect to initialize or reset the hook's state when props change (e.g., loading initial data on edit page)
  useEffect(() => {
    const isEditMode = initialAllocations.length > 0;
    
    // 1. Determine the split method
    const newSplitMethod = isEditMode && !areInitialAllocationsEqual(initialAllocations) ? 'custom' : 'equally';
    setSplitMethod(newSplitMethod);

    // 2. Determine involved members
    const involved = isEditMode
      ? initialAllocations.filter(a => a.amount > 0.005).map(a => a.memberId)
      : allMembers.map(m => m.id!);
    setInvolvedMembers(new Set(involved));

    // 3. Initialize allocation amounts
    const newAllocations = allMembers.map(member => {
      const existing = isEditMode ? initialAllocations.find(a => a.memberId === member.id) : undefined;
      return {
        memberId: member.id!,
        amount: existing?.amount || 0,
      };
    });
    setAllocations(newAllocations);
    setIsInitialRender(false);

  }, [initialAllocations, allMembers]);


  // Effect to recalculate equal split amounts when dependencies change
  useEffect(() => {
    if (splitMethod === 'equally') {
      const amountPerPerson = involvedMembers.size > 0 ? totalAmount / involvedMembers.size : 0;
      setAllocations(prev =>
        prev.map(alloc => ({
          ...alloc,
          amount: involvedMembers.has(alloc.memberId) ? amountPerPerson : 0,
        }))
      );
    }
  }, [totalAmount, involvedMembers, splitMethod]);
  
  // FIX: Added a dedicated effect to pre-fill custom amounts when switching from 'equally'.
  // This resolves the bug where selecting "Custom" wouldn't work as expected.
  useEffect(() => {
    // Prevent this from running on the initial render where state is still being set up.
    if (isInitialRender) return;

    if (splitMethod === 'custom') {
      // Check if the current allocations are all zero, which suggests we just switched from 'equally'
      // where the user hadn't entered any custom amounts yet.
      const isPristineCustom = allocations.every(a => a.amount === 0);
      
      const amountPerPerson = involvedMembers.size > 0 ? totalAmount / involvedMembers.size : 0;
      
      // Only pre-fill if the total is > 0 and custom fields are empty, to avoid overwriting user input.
      if (totalAmount > 0 && isPristineCustom) {
        setAllocations(prev =>
          prev.map(alloc => ({
            ...alloc,
            amount: involvedMembers.has(alloc.memberId) ? amountPerPerson : 0,
          }))
        );
      }
    }
  }, [splitMethod, isInitialRender]);


  const toggleMemberInvolvement = (memberId: number) => {
    setInvolvedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const updateAllocation = (memberId: number, newAmountStr: string) => {
    if (splitMethod !== 'custom') return;
    const newAmount = Math.max(0, parseFloat(newAmountStr) || 0);
    setAllocations(prev =>
      prev.map(alloc =>
        alloc.memberId === memberId ? { ...alloc, amount: newAmount } : alloc
      )
    );
  };
  
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, alloc) => sum + (involvedMembers.has(alloc.memberId) ? alloc.amount : 0), 0);
  }, [allocations, involvedMembers]);
  
  const remainingAmount = useMemo(() => totalAmount - totalAllocated, [totalAmount, totalAllocated]);

  const isValid = useMemo(() => Math.abs(remainingAmount) < 0.01 && involvedMembers.size > 0 && totalAmount > 0, [remainingAmount, involvedMembers, totalAmount]);
  
  const finalAllocations = useMemo(() => {
    return allocations
      .filter(a => involvedMembers.has(a.memberId) && a.amount > 0.005)
      .map(({ memberId, amount }) => ({ memberId, amount }));
  }, [allocations, involvedMembers]);


  return {
    splitMethod,
    setSplitMethod,
    allocations,
    updateAllocation,
    involvedMembers,
    toggleMemberInvolvement,
    totalAllocated,
    remainingAmount,
    isValid,
    finalAllocations,
  };
}