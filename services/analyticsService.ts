
import type { Member, ExpenseWithDetails } from '../types';

interface Balance {
  member: Member;
  balance: number;
}

export const calculateBalances = (members: Member[], expenses: ExpenseWithDetails[]): Balance[] => {
  const memberBalances: { [key: number]: number } = {};
  
  members.forEach(member => {
    memberBalances[member.id!] = 0;
  });

  expenses.forEach(expense => {
    // The payer is owed the full amount
    if (memberBalances[expense.payerMemberId] !== undefined) {
      memberBalances[expense.payerMemberId] += expense.amount;
    }

    // Each person involved in the split owes their share
    expense.allocations.forEach(allocation => {
      if (memberBalances[allocation.memberId] !== undefined) {
        memberBalances[allocation.memberId] -= allocation.amount;
      }
    });
  });

  return members.map(member => ({
    member,
    balance: memberBalances[member.id!] || 0,
  }));
};
