export type AppThemeMode = 'dark' | 'light' | 'oled';

export type SupportedCurrency = 'PKR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'EGP';

export type PaymentMethod = 'cash' | 'bank' | 'mobile_wallet';

export type SimpleEntryType = 'money_in' | 'expense' | 'lent' | 'borrowed' | 'returned';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  pinHash: string; // SHA-256 or secure hash
  biometricsEnabled: boolean;
  biometricCredentialId?: string;
  createdAt: string;
}

export interface SimpleMoneyEntry {
  id: string;
  userId: string;
  type: SimpleEntryType;
  amount: number;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM e.g. '2026-10'
  whatFor: string; // e.g. "Groceries", "Salary", "Rent"
  person?: string; // e.g. "Ali", "Father"
  returnDate?: string; // YYYY-MM-DD for loan due dates
  isExtra?: boolean; // Extra spending? toggle (yes/no)
  paymentMethod?: PaymentMethod;
  savingsGoalSet?: number; // When entering salary, optional goal for the month
  notes?: string;
  isCleared?: boolean; // For loans
  linkedLoanId?: string; // For repayment
  createdAt: string;
  updatedAt?: string;
}

export interface MonthBook {
  monthKey: string; // YYYY-MM e.g. '2026-10'
  monthLabel: string; // e.g. 'October 2026'
  goal: number; // This month's savings goal
  stillToSaveFromBefore: number; // Carryover shortfall from previous months
  target: number; // goal + stillToSaveFromBefore
  isLocked: boolean;
  lockedAt?: string;
  lockedSavedAmount?: number;
  takenBackAmount?: number; // If money was withdrawn from locked savings
}

export type NoteColor =
  | 'default'
  | 'amber'
  | 'emerald'
  | 'blue'
  | 'purple'
  | 'rose'
  | 'teal'
  | 'slate';

export interface DetectedMoneyPrompt {
  id: string;
  type: SimpleEntryType;
  amount: number;
  date: string;
  personOrCategory: string;
  rawSnippet: string;
  confirmed?: boolean;
}

export interface SmartNote {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM e.g. '2026-10'
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  detectedPrompt?: DetectedMoneyPrompt | null;
}

export interface SalaryBreakdownConfig {
  baseSalary: number;
  payPeriod: 'monthly' | 'annually' | 'biweekly';
  taxRatePercent: number; // e.g. 5%
  providentFundPercent: number; // e.g. 8%
  medicalAllowance: number;
  otherDeductions: number;
  bonusExpected: number;
}

export interface AppSettings {
  labelLanguage: 'en' | 'roman_urdu';
  currency: SupportedCurrency;
  notificationTime: string; // e.g. '09:00'
  theme: AppThemeMode;
  autoLockMinutes: number; // 0 = disabled, 1, 5, 15
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'loan' | 'extra' | 'savings' | 'lock' | 'general';
}
