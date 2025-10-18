// FIX: Changed to separate default and type imports for Dexie to resolve method resolution errors.
import Dexie from 'dexie';
import type { Table } from 'dexie';
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
      // FIX: The primary key for the settings table must be 'id' to match the Setting interface and usage in the app.
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

    // Version 3 adds password to users table
    this.version(3).stores({
      groups: '++id, name',
      members: '++id, groupId, name',
      categories: '++id, name',
      expenses: '++id, groupId, date, categoryId, payerMemberId',
      allocations: '++id, expenseId, memberId',
      settings: 'id',
      users: '++id, name, email, password',
    });

    // Version 4 adds type to groups table
    this.version(4).stores({
      groups: '++id, name, type',
      members: '++id, groupId, name',
      categories: '++id, name',
      expenses: '++id, groupId, date, categoryId, payerMemberId',
      allocations: '++id, expenseId, memberId',
      settings: 'id',
      users: '++id, name, email, password',
    });
  }

  async seed() {
    // Seed predefined categories if none exist
    const categoryCount = await this.categories.count();
    if (categoryCount === 0) {
      await this.categories.bulkAdd(PREDEFINED_CATEGORIES);
    }

    // Add default settings if missing
    const onboarded = await this.settings.get('onboarded');
    if (!onboarded) {
      // FIX: Use 'id' as the key for settings to match the schema.
      await this.settings.put({ id: 'onboarded', value: false });
    }

    const theme = await this.settings.get('theme');
    if (!theme) {
      // FIX: Use 'id' as the key for settings to match the schema.
      await this.settings.put({ id: 'theme', value: 'light' });
    }
  }
}

export const db = new AppDatabase();

// Populate when database is first created
db.on('populate', async () => {
  await db.seed();
});

// Also ensure seeding runs after DB opens normally
db.open()
  .then(() => db.seed())
  .catch(err => {
    console.error(`Failed to open db: ${err.stack || err}`);
  });