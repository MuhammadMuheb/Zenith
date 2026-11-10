import { BudgetItem, Note, SalaryConfig } from '../types';
import { SalaryBreakdown } from './salaryMath';

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Monthly Budget Expenses to CSV
 */
export function exportExpensesToCSV(expenses: BudgetItem[], monthName: string = 'Current-Month') {
  const headers = ['ID', 'Title', 'Category', 'Bucket (50/30/20)', 'Amount ($)', 'Date', 'Recurring', 'Paid Status', 'Payment Method', 'Notes'];
  
  const rows = expenses.map((e) => [
    `"${e.id}"`,
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.category}"`,
    `"${e.bucket.toUpperCase()}"`,
    e.amount.toFixed(2),
    `"${e.date}"`,
    e.isRecurring ? 'Yes' : 'No',
    e.isPaid ? 'Paid' : 'Pending',
    `"${e.paymentMethod}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(`zenith-budget-expenses-${monthName}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Export Full Encrypted Backup Vault (.vault or .json)
 */
export function exportVaultBackup(vaultData: {
  notes: Note[];
  budget: BudgetItem[];
  salary: SalaryConfig;
  exportedAt: string;
  e2eeEnabled: boolean;
  appVersion: string;
}) {
  const json = JSON.stringify(vaultData, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(`zenith-backup-vault-${dateStr}.vault`, json, 'application/json');
}

/**
 * Trigger print dialog with specific print layout
 */
export function triggerPrintReport() {
  window.print();
}
