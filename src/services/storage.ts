import {
  UserProfile,
  SimpleMoneyEntry,
  MonthBook,
  SmartNote,
  AppSettings,
  AppNotification,
  SalaryBreakdownConfig,
} from '../types';

export const STORAGE_PREFIX = 'zenith_app_';

export const DEFAULT_SETTINGS: AppSettings = {
  labelLanguage: 'en',
  currency: 'PKR',
  notificationTime: '09:00',
  theme: 'dark',
  autoLockMinutes: 5,
};

export const DEFAULT_SALARY_CONFIG: SalaryBreakdownConfig = {
  baseSalary: 0,
  payPeriod: 'monthly',
  taxRatePercent: 0,
  providentFundPercent: 0,
  medicalAllowance: 0,
  otherDeductions: 0,
  bonusExpected: 0,
};

export interface UserVaultData {
  profile: UserProfile;
  entries: SimpleMoneyEntry[];
  monthBooks: MonthBook[];
  notes: SmartNote[];
  settings: AppSettings;
  salaryConfig: SalaryBreakdownConfig;
  notifications: AppNotification[];
}

export function getActiveUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + 'active_user');
  } catch {
    return null;
  }
}

export function setActiveUserId(userId: string | null) {
  try {
    if (userId) {
      localStorage.setItem(STORAGE_PREFIX + 'active_user', userId);
    } else {
      localStorage.removeItem(STORAGE_PREFIX + 'active_user');
    }
  } catch (err) {
    console.error('Failed to set active user ID', err);
  }
}

export function getAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
}

export function loadUserData(userId: string): UserVaultData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'data_' + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserVaultData;

    // Purge any lingering hardcoded demo entries if present
    if (parsed && Array.isArray(parsed.entries)) {
      parsed.entries = parsed.entries.filter(
        (e) => !e.id.startsWith('oct-') && !e.id.startsWith('nov-')
      );
    }
    if (parsed && Array.isArray(parsed.monthBooks)) {
      parsed.monthBooks = parsed.monthBooks.filter(
        (b) => b.monthKey !== '2026-10' && b.monthKey !== '2026-11'
      );
    }
    if (parsed && Array.isArray(parsed.notes)) {
      parsed.notes = parsed.notes.filter((n) => !n.id.startsWith('note-sample-'));
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveUserData(userId: string, data: UserVaultData) {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'data_' + userId, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save user data', err);
  }
}

export function createFreshUserData(user: UserProfile): UserVaultData {
  return {
    profile: user,
    entries: [],
    monthBooks: [],
    notes: [],
    settings: DEFAULT_SETTINGS,
    salaryConfig: DEFAULT_SALARY_CONFIG,
    notifications: [],
  };
}

export function purgeAllUserData(userId: string, profile: UserProfile): UserVaultData {
  const fresh = createFreshUserData(profile);
  saveUserData(userId, fresh);
  return fresh;
}
