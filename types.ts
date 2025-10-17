
export interface Group {
  id?: number;
  name: string;
  currency: string;
}

export interface Member {
  id?: number;
  groupId: number;
  name: string;
}

export interface Category {
  id?: number;
  name: string;
}

export interface Expense {
  id?: number;
  groupId: number;
  description: string;
  amount: number;
  date: Date;
  categoryId: number;
  payerMemberId: number;
  receiptImage?: string; // base64 encoded image
}

export interface Allocation {
  id?: number;
  expenseId: number;
  memberId: number;
  amount: number;
}

export interface Setting {
  id: string; // 'theme', 'currency', 'onboarded'
  value: any;
}

export interface ExpenseWithDetails extends Expense {
    category: Category;
    payer: Member;
    allocations: (Allocation & { member: Member })[];
}
