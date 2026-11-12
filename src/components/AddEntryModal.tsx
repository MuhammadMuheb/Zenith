import React, { useState } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  CheckCircle,
  Calendar,
  User,
  Tag,
} from 'lucide-react';
import { SimpleEntryType, PaymentMethod, SimpleMoneyEntry, SupportedCurrency } from '../types';
import { formatMoney } from '../services/currency';

interface AddEntryModalProps {
  currentMonthKey: string;
  initialType?: SimpleEntryType;
  stillToSaveFromBefore: number;
  currentMonthGoal: number;
  activeCurrency: SupportedCurrency;
  existingLoans?: SimpleMoneyEntry[];
  onAddEntry: (entry: Omit<SimpleMoneyEntry, 'id' | 'createdAt' | 'userId'>) => void;
  onClose: () => void;
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  currentMonthKey,
  initialType = 'expense',
  stillToSaveFromBefore,
  currentMonthGoal,
  activeCurrency,
  existingLoans = [],
  onAddEntry,
  onClose,
}) => {
  const [entryType, setEntryType] = useState<SimpleEntryType>(initialType);

  // Common inputs
  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    if (today.startsWith(currentMonthKey)) return today;
    return `${currentMonthKey}-01`;
  });
  const [whatFor, setWhatFor] = useState('Groceries');
  const [person, setPerson] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isExtra, setIsExtra] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [savingsGoalInput, setSavingsGoalInput] = useState(
    currentMonthGoal ? currentMonthGoal.toString() : '0'
  );
  const [notes, setNotes] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');

  const numAmount = parseFloat(amountStr.replace(/,/g, '')) || 0;
  const numGoal = parseFloat(savingsGoalInput.replace(/,/g, '')) || 0;
  const totalNeedToSave = numGoal + stillToSaveFromBefore;

  // Pending open loans for "Money returned to me"
  const openLoans = existingLoans.filter(
    (l) => l.type === 'lent' && !l.isCleared
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    let targetMonthKey = dateStr.substring(0, 7);
    if (!targetMonthKey) targetMonthKey = currentMonthKey;

    let finalWhatFor = whatFor;
    if (entryType === 'money_in') {
      finalWhatFor = whatFor || 'Salary';
    } else if (entryType === 'lent') {
      finalWhatFor = `Loan to ${person || 'Friend'}`;
    } else if (entryType === 'borrowed') {
      finalWhatFor = `Borrowed from ${person || 'Friend'}`;
    } else if (entryType === 'returned') {
      finalWhatFor = `Loan returned by ${person || 'Friend'}`;
    }

    onAddEntry({
      type: entryType,
      amount: numAmount,
      date: dateStr,
      monthKey: targetMonthKey,
      whatFor: finalWhatFor,
      person: person || undefined,
      returnDate: returnDate || undefined,
      isExtra: entryType === 'expense' ? isExtra : false,
      paymentMethod,
      savingsGoalSet: entryType === 'money_in' ? numGoal : undefined,
      notes: notes || undefined,
      linkedLoanId: selectedLoanId || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Fixed Header with clear Close & Cancel */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 shrink-0 bg-neutral-900">
          <div>
            <h2 className="text-base font-bold text-white">Add Entry</h2>
            <p className="text-[11px] text-neutral-400">Quickly log income, expense, or loans</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Cancel / Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {/* 5 Entry Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setEntryType('expense')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition ${
                entryType === 'expense'
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ArrowUpRight className="h-3 w-3 text-rose-400" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryType('money_in')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition ${
                entryType === 'money_in'
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
              <span>Money in</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryType('lent')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition ${
                entryType === 'lent'
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <HandCoins className="h-3 w-3 text-amber-400" />
              <span>I lent</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryType('borrowed')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition ${
                entryType === 'borrowed'
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <HandCoins className="h-3 w-3 text-sky-400" />
              <span>Borrowed</span>
            </button>

            <button
              type="button"
              onClick={() => setEntryType('returned')}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition col-span-2 ${
                entryType === 'returned'
                  ? 'bg-neutral-800 text-white font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CheckCircle className="h-3 w-3 text-emerald-400" />
              <span>Returned to me</span>
            </button>
          </div>

          {/* Amount & Date side by side */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">
                  {activeCurrency === 'PKR' ? 'Rs.' : activeCurrency}
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 pl-11 pr-3 py-1.5 text-sm font-bold text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 pl-8 pr-2 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 1. Expense Details */}
          {entryType === 'expense' && (
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">What was it for?</label>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={whatFor}
                    onChange={(e) => setWhatFor(e.target.value)}
                    placeholder="Groceries, Rent, Fuel, etc."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 pl-8 pr-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {/* Compact Quick tags */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Groceries', 'Utilities', 'Rent', 'Food', 'Transport', 'Medical', 'Shopping'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setWhatFor(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                        whatFor === cat
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Spending Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/50">
                <div>
                  <span className="text-xs font-semibold text-neutral-200">Extra spending?</span>
                  <p className="text-[10px] text-neutral-400">Flag as non-routine extra expenditure</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExtra(!isExtra)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                    isExtra ? 'bg-amber-500 justify-end' : 'bg-neutral-800 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Paid via</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'bank', 'mobile_wallet'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 px-1 text-[11px] rounded-lg border capitalize transition ${
                        paymentMethod === m
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. Money In */}
          {entryType === 'money_in' && (
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Description / Source</label>
                <input
                  type="text"
                  value={whatFor}
                  onChange={(e) => setWhatFor(e.target.value)}
                  placeholder="Salary / Freelance"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['bank', 'cash', 'mobile_wallet'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1.5 px-1 text-[11px] rounded-lg border capitalize transition ${
                        paymentMethod === m
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Optional Monthly Savings Goal
                </label>
                <input
                  type="number"
                  value={savingsGoalInput}
                  onChange={(e) => setSavingsGoalInput(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 3. Lent */}
          {entryType === 'lent' && (
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Person lent to</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder="e.g. Ali, Brother, Friend"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 pl-8 pr-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Return / Due Date</label>
                <input
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 4. Borrowed */}
          {entryType === 'borrowed' && (
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Borrowed from</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder="e.g. Ali"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 pl-8 pr-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Repayment Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 5. Returned */}
          {entryType === 'returned' && (
            <div className="space-y-2.5 pt-1">
              {openLoans.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">Link to Lent Loan</label>
                  <select
                    value={selectedLoanId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedLoanId(id);
                      const loan = openLoans.find((l) => l.id === id);
                      if (loan) {
                        setPerson(loan.person || '');
                        setAmountStr(loan.amount.toString());
                      }
                    }}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select loan...</option>
                    {openLoans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.person} ({formatMoney(l.amount, activeCurrency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">Person Name</label>
                <input
                  type="text"
                  required
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder="e.g. Ali"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Note (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brief memo"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </form>

        {/* Fixed Footer: Always visible Cancel and Save buttons */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};
