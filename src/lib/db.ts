import Dexie, { type EntityTable } from 'dexie';

export interface Ticket {
  id?: number;
  profileId?: number;
  name: string;
  parentId: number | null; // null for top-level
  level: 1 | 2 | 3;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // mostly for top-level
  icon?: string;
  target?: number | null;
  isTemplate?: boolean;
  defaultAmount?: number;
}

export interface ExpenseLog {
  id?: number;
  profileId?: number;
  ticketId: number;
  amount: number;
  date: string; // ISO string for easy querying
  periodLabel: string; // e.g., '2026-03-18' or '2026-W12' or '2026-03'
}

export interface PriceHistory {
  id?: number;
  profileId?: number;
  ticketId: number;
  oldAmount: number;
  newAmount: number;
  date: string;
}

export interface ChoreItem {
  id?: number;
  profileId?: number;
  title: string;
  parentId: number | null;
  icon?: string;
  isRecurring?: boolean;
}

export interface ChoreLog {
  id?: number;
  profileId?: number;
  choreId: number;
  date: string;
}

export interface Settings {
  id?: number;
  userName: string;
  userPicture: string; // emoji or base64
  defaultPeriod: 'daily' | 'weekly' | 'monthly';
}

const db = new Dexie('LifeLedgerData') as Dexie & {
  tickets: EntityTable<Ticket, 'id'>;
  expenseLogs: EntityTable<ExpenseLog, 'id'>;
  priceHistory: EntityTable<PriceHistory, 'id'>;
  choreItems: EntityTable<ChoreItem, 'id'>;
  choreLogs: EntityTable<ChoreLog, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

// Schema declaration
db.version(1).stores({
  tickets: '++id, parentId, level, isTemplate',
  expenseLogs: '++id, ticketId, date, periodLabel',
  priceHistory: '++id, ticketId, date',
  choreItems: '++id, parentId',
  choreLogs: '++id, choreId, date',
  settings: '++id'
});

db.version(2).stores({
  tickets: '++id, profileId, parentId, level, isTemplate',
  expenseLogs: '++id, profileId, ticketId, date, periodLabel',
  priceHistory: '++id, profileId, ticketId, date',
  choreItems: '++id, profileId, parentId',
  choreLogs: '++id, profileId, choreId, date',
}).upgrade(async tx => {
  // Get the first profile ID
  const firstProfile = await tx.table('settings').toCollection().first();
  if (firstProfile) {
    const pid = firstProfile.id;
    await tx.table('tickets').toCollection().modify({ profileId: pid });
    await tx.table('expenseLogs').toCollection().modify({ profileId: pid });
    await tx.table('priceHistory').toCollection().modify({ profileId: pid });
    await tx.table('choreItems').toCollection().modify({ profileId: pid });
    await tx.table('choreLogs').toCollection().modify({ profileId: pid });
  }
});

export { db };

