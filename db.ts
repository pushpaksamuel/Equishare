
import { Dexie, type Table } from 'dexie';
import type { Group, Member, Category, Expense, Allocation, Setting } from './types';
import { PREDEFINED_CATEGORIES } from './constants';

export class AppDatabase extends Dexie {
  groups!: Table<Group, number>;
  members!: Table<Member, number>;
  categories!: Table<Category, number>;
  expenses!: Table<Expense, number>;
  allocations!: Table<Allocation, number>;
  settings!: Table<Setting, string>;

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