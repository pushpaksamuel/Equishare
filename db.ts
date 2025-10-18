import Dexie, { type Table } from 'dexie';
import type { Group, Member, Category, Expense, Allocation, User, Setting } from './types';
import { PREDEFINED_CATEGORIES } from './constants';

export const db = new Dexie('equishareDB') as Dexie & {
  groups: Table<Group, number>;
  members: Table<Member, number>;
  categories: Table<Category, number>;
  expenses: Table<Expense, number>;
  allocations: Table<Allocation, number>;
  settings: Table<Setting, string>;
  users: Table<User, number>;
};

db.version(4).stores({
  groups: '++id, name, type',
  members: '++id, groupId, name',
  categories: '++id, name',
  expenses: '++id, groupId, date, categoryId, payerMemberId',
  allocations: '++id, expenseId, memberId',
  settings: 'id',
  users: '++id, &email'
});

db.on('populate', async () => {
  // This hook only runs once when the database is first created.
  // We initialize it with predefined categories and essential settings.
  await db.categories.bulkAdd(PREDEFINED_CATEGORIES);
  await db.settings.bulkAdd([
    { id: 'theme', value: 'light' },
    { id: 'onboarded', value: false } // Ensures the app doesn't get stuck on first load.
  ]);
});

// This block ensures the database is ready and performs a safety check.
db.open()
  .then(async () => {
    // This safety check is crucial for users with existing databases from older versions
    // that might not have the 'onboarded' setting. It prevents the app from getting stuck.
    const onboardedSetting = await db.settings.get('onboarded');
    if (onboardedSetting === undefined) {
      console.log("Onboarding setting not found, initializing to prevent loading issues.");
      await db.settings.put({ id: 'onboarded', value: false });
    }
  })
  .catch(err => {
    console.error(`Failed to open db: ${err.stack || err}`);
  });
