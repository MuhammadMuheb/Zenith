import { SimpleMoneyEntry, MonthBook, AppNotification } from '../types';

export function getMonthKeyFromDate(dateStr: string): string {
  // expects YYYY-MM-DD or ISO
  if (!dateStr) return '';
  return dateStr.substring(0, 7);
}

export function formatMonthKeyLabel(monthKey: string): string {
  if (!monthKey || monthKey.length < 7) return '';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const d = new Date(year, month, 1);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function calculateMonthTotals(monthKey: string, entries: SimpleMoneyEntry[]) {
  const monthEntries = entries.filter((e) => e.monthKey === monthKey);

  // Came in = Salary / Money In + Borrowed
  const cameIn = monthEntries
    .filter((e) => e.type === 'money_in' || e.type === 'borrowed')
    .reduce((sum, e) => sum + e.amount, 0);

  // Spent = Expense + Lent
  const spent = monthEntries
    .filter((e) => e.type === 'expense' || e.type === 'lent')
    .reduce((sum, e) => sum + e.amount, 0);

  const left = cameIn - spent;

  return { cameIn, spent, left };
}

export function ensureMonthBook(
  monthKey: string,
  existingBooks: MonthBook[],
  entries: SimpleMoneyEntry[],
  defaultGoal: number = 0
): MonthBook[] {
  const found = existingBooks.find((b) => b.monthKey === monthKey);
  if (found) return existingBooks;

  // Calculate stillToSaveFromBefore from previous chronological month
  const sorted = [...existingBooks].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  let stillToSaveFromBefore = 0;
  if (sorted.length > 0) {
    const lastBook = sorted[sorted.length - 1];
    if (lastBook.isLocked) {
      const lockedAmount = lastBook.lockedSavedAmount || 0;
      const target = lastBook.target || lastBook.goal;
      const shortfall = Math.max(0, target - lockedAmount);
      stillToSaveFromBefore = shortfall + (lastBook.takenBackAmount || 0);
    }
  }

  const newBook: MonthBook = {
    monthKey,
    monthLabel: formatMonthKeyLabel(monthKey),
    goal: defaultGoal,
    stillToSaveFromBefore,
    target: defaultGoal + stillToSaveFromBefore,
    isLocked: false,
  };

  return [...existingBooks, newBook];
}

// Auto-lock overdue months (1st of next month at 12:00 AM)
export function checkAndAutoLockMonths(
  books: MonthBook[],
  entries: SimpleMoneyEntry[],
  onNotification?: (notif: AppNotification) => void
): { updatedBooks: MonthBook[]; notifications: AppNotification[] } {
  const today = new Date();
  const currentMonthKey = today.toISOString().substring(0, 7);
  const newNotifs: AppNotification[] = [];

  const updatedBooks = books.map((book) => {
    // If already locked, skip
    if (book.isLocked) return book;

    // If monthKey is older than current month (e.g. '2026-10' when today is in '2026-11' or later)
    if (book.monthKey < currentMonthKey) {
      const { left } = calculateMonthTotals(book.monthKey, entries);
      const lockedSavedAmount = Math.max(0, left);

      const notif: AppNotification = {
        id: 'lock-' + book.monthKey + '-' + Date.now(),
        title: 'Month locked',
        message: `${book.monthLabel.split(' ')[0]} is done. ${lockedSavedAmount.toLocaleString()} moved to Savings.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'lock',
      };
      newNotifs.push(notif);
      if (onNotification) onNotification(notif);

      return {
        ...book,
        isLocked: true,
        lockedAt: new Date().toISOString(),
        lockedSavedAmount,
      };
    }
    return book;
  });

  return { updatedBooks, notifications: newNotifs };
}
