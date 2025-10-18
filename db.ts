// FIX: Changed Dexie import to use a default import to resolve method typing issues.
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

    // Version 1 schema
    this.version(1).stores({
      groups: '++id, name',
      members: '++id, groupId, name',
      categories: '++id, name',
      expenses: '++id, groupId, date, categoryId, payerMemberId',
      allocations: '++id, expenseId, memberId',
      settings: 'key', // ✅ changed from 'id' to 'key'
    });

    // Version 2 adds the users table
    this.version(2).stores({
      groups: '++id, name',
      members: '++id, groupId, name',
      categories: '++id, name',
      expenses: '++id, groupId, date, categoryId, payerMemberId',
      allocations: '++id, expenseId, memberId',
      settings: 'key',
      users: '++id, name',
    });

    // Version 3 adds password to users table
    this.version(3).stores({
      groups: '++id, name',
      members: '++id, groupId, name',
      categories: '++id, name',
      expenses: '++id, groupId, date, categoryId, payerMemberId',
      allocations: '++id, expenseId, memberId',
      settings: 'key',
      users: '++id, name, email, password',
    });
  }

  async seed() {
    // ✅ Seed predefined categories if none exist
    const categoryCount = await this.categories.count();
    if (categoryCount === 0) {
      await this.categories.bulkAdd(PREDEFINED_CATEGORIES);
    }

    // ✅ Add default settings if missing
    const onboarded = await this.settings.get('onboarded');
    if (!onboarded) {
      await this.settings.put({ key: 'onboarded', value: false });
    }

    const theme = await this.settings.get('theme');
    if (!theme) {
      await this.settings.put({ key: 'theme', value: 'light' });
    }
  }
}

export const db = new AppDatabase();

// ✅ Populate when database is first created
db.on('populate', async () => {
  await db.seed();
});

// ✅ Also ensure seeding runs after DB opens normally
db.open()
  .then(() => db.seed())
  .catch(err => {
    console.error(`Failed to open db: ${err.stack || err}`);
  });