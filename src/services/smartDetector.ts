import { DetectedMoneyPrompt, SimpleEntryType } from '../types';

export function detectMoneyInText(text: string): DetectedMoneyPrompt | null {
  if (!text || text.trim().length === 0) return null;

  // Regex to detect monetary amounts like 80,000, 5000, Rs. 25,000, $500, etc.
  const amountRegex = /(?:rs\.?|\$|€|£|aed|pkr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,7})(?:\s*(?:rs\.?|rupees|usd))?/i;
  const match = text.match(amountRegex);
  if (!match) return null;

  const rawAmountStr = match[1].replace(/,/g, '');
  const amount = parseInt(rawAmountStr, 10);
  if (isNaN(amount) || amount <= 0) return null;

  const lower = text.toLowerCase();
  let type: SimpleEntryType = 'expense';
  let personOrCategory = 'General Expense';

  // Determine type & person/category
  if (
    lower.includes('salary') ||
    lower.includes('tankhwah') ||
    lower.includes('paycheck') ||
    lower.includes('income') ||
    lower.includes('wallet in')
  ) {
    type = 'money_in';
    personOrCategory = 'Salary';
  } else if (
    lower.includes('took') ||
    lower.includes('borrowed') ||
    lower.includes('udhaar liya') ||
    lower.includes('loan from')
  ) {
    type = 'borrowed';
    // try to find person e.g. "from Ali"
    const personMatch = text.match(/from\s+([A-Za-z]+)/i);
    personOrCategory = personMatch ? personMatch[1] : 'Friend';
  } else if (
    lower.includes('lent') ||
    lower.includes('gave') ||
    lower.includes('diya') ||
    lower.includes('loan to') ||
    lower.includes('udhaar diya')
  ) {
    type = 'lent';
    const personMatch = text.match(/to\s+([A-Za-z]+)/i);
    personOrCategory = personMatch ? personMatch[1] : 'Friend';
  } else if (
    lower.includes('returned') ||
    lower.includes('wapas') ||
    lower.includes('paid back')
  ) {
    type = 'returned';
    const personMatch = text.match(/from\s+([A-Za-z]+)/i);
    personOrCategory = personMatch ? personMatch[1] : 'Friend';
  } else {
    // Expense category detection
    if (lower.includes('grocer') || lower.includes('sauda')) {
      personOrCategory = 'Groceries';
    } else if (lower.includes('rent') || lower.includes('kiraya')) {
      personOrCategory = 'Rent';
    } else if (lower.includes('bill') || lower.includes('bijli') || lower.includes('gas')) {
      personOrCategory = 'Utilities';
    } else if (lower.includes('food') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('hotel')) {
      personOrCategory = 'Dining & Food';
    } else if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('uber') || lower.includes('ride')) {
      personOrCategory = 'Transport';
    } else {
      personOrCategory = 'Expense';
    }
  }

  // Detect Date
  const today = new Date();
  let dateStr = today.toISOString().split('T')[0];

  const monthsMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  const dateMatch = text.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const mon = monthsMap[dateMatch[2].toLowerCase().substring(0, 3)];
    const year = today.getFullYear();
    const d = new Date(year, mon, day);
    dateStr = d.toISOString().split('T')[0];
  } else if (lower.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    dateStr = d.toISOString().split('T')[0];
  }

  return {
    id: 'prompt-' + Date.now(),
    type,
    amount,
    date: dateStr,
    personOrCategory,
    rawSnippet: match[0],
    confirmed: false,
  };
}
