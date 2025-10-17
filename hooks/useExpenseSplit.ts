import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const initialSplitMethod = initialAllocations.length > 0 && !areInitialAllocationsEqual(initialAllocations) ? 'custom' : 'equally';
  const [splitMethod, setSplitMethod] = useState<'equally' | 'custom'>(initialSplitMethod);
  
  const [involvedMembers, setInvolvedMembers] = useState<Set<number>>(() => {
    const involved = initialAllocations.filter(a => a.amount > 0.005).map(a => a.memberId);
    return new Set(involved.length > 0 ? involved : allMembers.map(m => m.id!));
  });

  const [allocations, setAllocations] = useState<AllocationInput[]>([]);

  const initializeAllocations = useCallback(() => {
    const newAllocations = allMembers.map(member => {
      const existing = initialAllocations.find(a => a.memberId === member.id);
      return {
        memberId: member.id!,
        amount: existing?.amount || 0,
      };
    });
    setAllocations(newAllocations);
  }, [allMembers, initialAllocations]);

  useEffect(() => {
    initializeAllocations();
  }, [initializeAllocations]);
  
  const handleSplitMethodChange = (method: 'equally' | 'custom') => {
     if (method === 'custom' && splitMethod === 'equally' && totalAmount > 0) {
      // Pre-fill custom amounts with equal split values when switching
      if (involvedMembers.size > 0) {
        const amountPerPerson = totalAmount / involvedMembers.size;
        setAllocations(prev =>
          prev.map(alloc => ({
            ...alloc,
            amount: involvedMembers.has(alloc.memberId) ? amountPerPerson : 0,
          }))
        );
      }
    }
    setSplitMethod(method);
  }


  useEffect(() => {
    if (splitMethod === 'equally') {
      if (involvedMembers.size > 0) {
        const amountPerPerson = totalAmount / involvedMembers.size;
        setAllocations(prev =>
          prev.map(alloc => ({
            ...alloc,
            amount: involvedMembers.has(alloc.memberId) ? amountPerPerson : 0,
          }))
        );
      } else {
        setAllocations(prev => prev.map(alloc => ({...alloc, amount: 0})));
      }
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

  const isValid = useMemo(() => Math.abs(remainingAmount) < 0.01 && involvedMembers.size > 0, [remainingAmount, involvedMembers]);
  
  const finalAllocations = useMemo(() => {
    return allocations
      .filter(a => involvedMembers.has(a.memberId) && a.amount > 0.005)
      .map(({ memberId, amount }) => ({ memberId, amount }));
  }, [allocations, involvedMembers]);


  return {
    splitMethod,
    setSplitMethod: handleSplitMethodChange,
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
