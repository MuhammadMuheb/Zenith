export type NoteColor =
  | 'default'
  | 'amber'
  | 'emerald'
  | 'blue'
  | 'purple'
  | 'rose'
  | 'teal'
  | 'slate';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  isTrash: boolean;
  tags: string[];
  checklist: ChecklistItem[];
  reminderDate?: string; // ISO string or YYYY-MM-DD
  isEncrypted?: boolean;
  cipherPayload?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'event' | 'salary' | 'bill' | 'reminder';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: EventType;
  color: string;
  amount?: number;
  linkedNoteId?: string;
  isCompleted?: boolean;
  isAlarmEnabled?: boolean;
  receivablePerson?: string;
}


export interface SalaryConfig {
  baseSalary: number;
  payPeriod: 'annually' | 'monthly' | 'biweekly' | 'hourly';
  hoursPerWeek: number;
  payDayFrequency: 'monthly' | 'semi-monthly' | 'bi-weekly';
  payDayDate: number; // Day of month e.g. 25, 28, 1
  payDayDateSecondary?: number; // For semi-monthly e.g. 15
  federalTaxRate: number; // e.g. 14 (%)
  stateTaxRate: number; // e.g. 5 (%)
  ficaTaxRate: number; // e.g. 7.65 (%)
  retirement401kPct: number; // e.g. 6 (%)
  healthInsuranceMonthly: number; // e.g. 240 ($)
  otherDeductionsMonthly: number; // e.g. 50 ($)
  bonusMonthlyAvg: number; // e.g. 200 ($)
  overtimeHoursPerMonth: number;
  overtimeMultiplier: number; // e.g. 1.5
  currency: string;
  history: Array<{
    id: string;
    date: string;
    title: string;
    annualEquivalent: number;
    notes?: string;
  }>;
}

export type BudgetBucket = 'need' | 'want' | 'savings';

export type ExpenseCategory =
  | 'Housing'
  | 'Utilities'
  | 'Groceries'
  | 'Dining & Food'
  | 'Transportation'
  | 'Healthcare'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Debt & Loans'
  | 'Savings & Investments'
  | 'Shopping'
  | 'Personal Care'
  | 'Other';

export interface BudgetItem {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  bucket: BudgetBucket;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'weekly' | 'yearly';
  dueDate?: number; // 1-31
  isPaid: boolean;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Cash' | 'Auto-Pay' | 'Raast' | 'EasyPaisa' | 'JazzCash' | 'Nayapay' | 'Sadapay';
  notes?: string;
  isEncrypted?: boolean;
}

export interface CategoryAllocation {
  category: ExpenseCategory;
  monthlyLimit: number;
  bucket: BudgetBucket;
  color: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'salary' | 'bill' | 'reminder' | 'security' | 'budget';
  read: boolean;
  actionTab?: 'notes' | 'calendar' | 'salary' | 'budget' | 'account' | 'savings';
}

export interface SecuritySettings {
  isLocked: boolean;
  isConfigured: boolean;
  pinHash: string; // SHA-256 hash
  biometricsEnabled: boolean;
  biometricCredentialId?: string;
  e2eeEnabled: boolean;
  masterSalt: string;
  autoLockMinutes: number; // 0 = immediate, 1, 5, 15, -1 = never
  lastActive: number;
}

export type AppThemeMode = 'dark' | 'light' | 'oled' | 'system';
export type AccentColor = 'emerald' | 'amber' | 'indigo' | 'rose' | 'cyan';

export interface DeviceSyncStatus {
  deviceId: string;
  deviceName: string;
  platform: 'Web' | 'iOS' | 'Android' | 'macOS';
  lastSynced: string;
  isCurrentDevice: boolean;
  syncState: 'in-sync' | 'syncing' | 'offline';
}

export type SupportedCurrency = 'USD' | 'PKR' | 'EGP' | 'EUR' | 'GBP';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  rateAgainstUSD: number;
  flag: string;
  locale: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number; // base USD
  currentAmount: number; // base USD
  monthlyContribution: number; // base USD
  targetDate: string; // YYYY-MM-DD
  category:
    | 'Emergency Fund'
    | 'House & Property'
    | 'Gold & Investment'
    | 'Vehicle'
    | 'Hajj & Travel'
    | 'Retirement'
    | 'General';
  annualReturnRate: number; // APY %
  isCompleted: boolean;
  notes?: string;
  createdAt: string;
}

export type LoanType = 'given_udhaar' | 'given_family' | 'taken_borrowed';
export type LoanStatus = 'pending' | 'partially_returned' | 'cleared' | 'gift_no_return';

export interface LoanMilestone {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  amount?: number;
  isAlarmEnabled: boolean;
  status: 'pending' | 'cleared';
}

export interface PersonDebtRecord {
  id: string;
  personName: string;
  amount: number;
  type: LoanType;
  dateGiven: string;
  expectedReturnDate?: string;
  milestones?: LoanMilestone[];
  returnedAmount: number;
  status: LoanStatus;
  notes?: string;
  monthPeriod: 'Previous Month' | 'Current Month' | 'General';
}

export interface MonthlyAccountRecord {
  id: string;
  monthLabel: string;
  incomeInflow: number;
  startingBalance: number;
  totalAvailable: number;
  totalSpent: number;
  endingBalance: number;
  savingsTarget: number;
  savingsAchieved: number;
  whyAnalysis: {
    title: string;
    explanation: string;
    positiveFactors: string[];
    negativeFactors: string[];
  };
}

export interface MonthExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  monthPeriod: 'previous' | 'current';
  date: string;
  recipient?: string;
  notes?: string;
}



