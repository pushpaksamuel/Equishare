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
  
  // Create a stable key based on the members' IDs. This prevents the effect from
  // re-running unnecessarily due to parent component re-renders creating a new
  // `allMembers` array reference with the same content.
  const memberKey = useMemo(() => allMembers.map(m => m.id).sort().join(','), [allMembers]);

  // This effect handles the initialization and reset logic. It now correctly
  // depends on the stable `memberKey` to avoid infinite loops.
  useEffect(() => {
    const isEditMode = initialAllocations.length > 0;

    // Determine the split method based on initial data (for edit mode)
    const newSplitMethod = isEditMode && !areInitialAllocationsEqual(initialAllocations) ? 'custom' : 'equally';
    setSplitMethod(newSplitMethod);

    // Determine which members are involved in the split
    const involved = isEditMode
      ? initialAllocations.filter(a => a.amount > 0.005).map(a => a.memberId)
      : allMembers.map(m => m.id!);
    setInvolvedMembers(new Set(involved));

    // Initialize the allocation amounts for each member
    const newAllocations = allMembers.map(member => {
      const existing = isEditMode ? initialAllocations.find(a => a.memberId === member.id) : undefined;
      return {
        memberId: member.id!,
        amount: existing?.amount || 0,
      };
    });
    setAllocations(newAllocations);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberKey, initialAllocations]);

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