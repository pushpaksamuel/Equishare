

import Dexie, { type Table } from 'dexie';
import type { Group, Member, Category, Expense, Allocation, Setting, User } from './types';
import { PREDEFINED_CATEGORIES } from './constants';

export class AppDatabase extends Dexie {
  groups!: Table<Group, number>;
  members!: Table<Member, number>;
  categories!: Table<Category, number>;
  expenses!: Table<Expense, number>;
  allocations!: Table<Allocation, number>;
  settings!: Table<Setting, string>;
  users!: Table<User, number>;

  constructor() {
    super('EquiShareDB');
    this.version(1).stores({
      groups: '++id, name',
      members: '++id, groupId, name',
      categories: '++id, name',
      expenses: '++id, groupId, date, categoryId, payerMemberId',
      allocations: '++id, expenseId, memberId',
      settings: 'id',
    });

    // Version 2 adds the users table
    this.version(2).stores({
      groups: '++id, name',
      members: '++id, groupId, name',
      categories: '++id, name',
      expenses: '++id, groupId, date, categoryId, payerMemberId',
      allocations: '++id, expenseId, memberId',
      settings: 'id',
      users: '++id, name',
    });
  }

  async seed() {
    const categoryCount = await this.categories.count();
    if (categoryCount === 0) {
      await this.categories.bulkAdd(PREDEFINED_CATEGORIES);
    }
  }
}

export const db = new AppDatabase();

db.on('populate', async () => {
    await db.seed();
});

// Open the database
db.open().catch(err => {
  console.error(`Failed to open db: ${err.stack || err}`);
});