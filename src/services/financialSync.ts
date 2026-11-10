import { MonthExpenseItem, PersonDebtRecord, Note, CalendarEvent } from '../types';

/**
 * Generates an auto-synchronized Master Financial Ledger Note for the Notepad (Google Keep).
 * Reflects all expenses, wallet balances, loans receivable, and 1-month & 2-month savings targets.
 */
export function generateMasterFinancialNote(
  expenses: MonthExpenseItem[],
  debtRecords: PersonDebtRecord[]
): Note {
  const prevExpenses = expenses.filter((e) => e.monthPeriod === 'previous');
  const currExpenses = expenses.filter((e) => e.monthPeriod === 'current');

  const totalPrevSpent = prevExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrSpent = currExpenses.reduce((sum, item) => sum + item.amount, 0);

  const prevCarryover = 80000 - totalPrevSpent; // Rs. 41,000
  const totalAvailable = prevCarryover + 80000; // Rs. 121,000
  const currentWalletBalance = totalAvailable - totalCurrSpent; // Rs. 96,000

  // 1-Month vs 2-Month Targets
  const oneMonthSalary = 80000;
  const twoMonthSalary = 160000;
  const oneMonthTarget = 60000;
  const twoMonthTarget = 120000;

  // Pending receivables / loans
  const pendingDebts = debtRecords.filter((d) => d.status === 'pending' && d.type === 'given_udhaar');
  const totalReceivable = pendingDebts.reduce((sum, d) => sum + (d.amount - d.returnedAmount), 0);
  const projectedBalanceAfterCollection = currentWalletBalance + totalReceivable; // Rs. 121,000

  const content = `=========================================
MASTER FINANCIAL LEDGER & AUTO-SYNCED NOTEPAD
(All additions from Ledger & Budget auto-sync here)
=========================================

1. SALARY & SAVINGS TARGETS (PKR):
• 1-Month Salary: Rs. ${oneMonthSalary.toLocaleString('en-PK')}
• 2-Month Total Salary: Rs. ${twoMonthSalary.toLocaleString('en-PK')} (Rs. 80,000 × 2)
• 1-Month Savings Target: Rs. ${oneMonthTarget.toLocaleString('en-PK')}
• 2-Month Savings Target: Rs. ${twoMonthTarget.toLocaleString('en-PK')} (Rs. 60,000 × 2)
• Current Wallet Cash in Hand: Rs. ${currentWalletBalance.toLocaleString('en-PK')}

2. MONEY RECEIVABLE & CALENDAR ALARMS (3-STAGE TIMELINE):
• 🔔 1 Oct 2026: Milestone 1 Alert — 60-Day Recovery Check-in from Father (Papa) (ALARM ACTIVE)
• 🔔 1 Nov 2026: Milestone 2 Alert — 30-Day Pre-Due Follow-up from Father (Papa) (ALARM ACTIVE)
• 🔔 1 Dec 2026: Final Settlement — Collect Rs. 25,000 from Father (Papa) (ALARM ACTIVE)
• Projected Wallet Cash After Recovery: Rs. ${projectedBalanceAfterCollection.toLocaleString('en-PK')}
  -> Reaches Rs. 121,000 (+Rs. 1,000 surplus above the 2-Month Rs. 120,000 Goal!)

3. MONTH 1 EXPENDITURES (Spent: Rs. ${totalPrevSpent.toLocaleString('en-PK')} | Carryover: Rs. ${prevCarryover.toLocaleString('en-PK')}):
${prevExpenses.map((e, idx) => `${idx + 1}. ${e.title}: Rs. ${e.amount.toLocaleString('en-PK')} (${e.category})`).join('\n')}

4. MONTH 2 EXPENDITURES & LOANS (Spent so far: Rs. ${totalCurrSpent.toLocaleString('en-PK')}):
${currExpenses.map((e, idx) => `${idx + 1}. ${e.title}: Rs. ${e.amount.toLocaleString('en-PK')} (${e.category})`).join('\n')}

5. OTHER FAMILY CONTRIBUTIONS (NON-REFUNDABLE):
${debtRecords.filter((d) => d.status === 'gift_no_return').map((d) => `• ${d.personName}: Rs. ${d.amount.toLocaleString('en-PK')} (${d.monthPeriod}) - Family Contribution`).join('\n')}

-----------------------------------------
Last Auto-Synced: ${new Date().toLocaleTimeString()} • ${new Date().toLocaleDateString()}`;

  const checklist = [
    {
      id: 'chk-papa-oct1',
      text: '🔔 1 Oct 2026: Milestone 1 Recovery Check-in from Father (Papa) (Alarm Set)',
      completed: false,
    },
    {
      id: 'chk-papa-nov1',
      text: '🔔 1 Nov 2026: Milestone 2 Pre-Due Follow-up from Father (Papa) (Alarm Set)',
      completed: false,
    },
    {
      id: 'chk-papa-dec1',
      text: '🔔 1 Dec 2026: Final Collection of Rs. 25,000 from Father (Papa) (Alarm Set)',
      completed: debtRecords.find((d) => d.personName.includes('Father') && d.status === 'cleared') !== undefined,
    },
    {
      id: 'chk-target-120k',
      text: 'Achieve 2-Month Cumulative Savings Target of Rs. 120,000 (Rs. 96k now -> Rs. 121k on collection)',
      completed: projectedBalanceAfterCollection >= twoMonthTarget,
    },
    {
      id: 'chk-target-60k',
      text: '1-Month Savings Goal of Rs. 60,000 (Currently Rs. 96,000 in wallet - 160% Achieved)',
      completed: true,
    },
    {
      id: 'chk-carryover',
      text: 'Month 1 Carryover of Rs. 41,000 successfully merged into Month 2 Available Cash',
      completed: true,
    },
  ];

  return {
    id: 'note-master-financial',
    title: '📒 Master Financial Ledger (Auto-Synced Notepad)',
    content,
    color: 'emerald',
    isPinned: true,
    isArchived: false,
    isTrash: false,
    tags: ['Financial Ledger', 'Auto-Synced', 'Important', 'PKR'],
    checklist,
    reminderDate: '2026-10-01',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Ensures all debt records with expected repayment dates and milestones have corresponding Calendar alarm events.
 */
export function syncDebtsToCalendarEvents(
  debtRecords: PersonDebtRecord[],
  currentEvents: CalendarEvent[]
): CalendarEvent[] {
  let updatedEvents = [...currentEvents];

  debtRecords.forEach((debt) => {
    // 1. Sync milestone alerts (e.g. 1 Oct 2026, 1 Nov 2026)
    if (debt.milestones && debt.milestones.length > 0) {
      debt.milestones.forEach((m) => {
        const mEventId = `evt-milestone-${m.id}`;
        const existingMIdx = updatedEvents.findIndex((e) => e.id === mEventId);
        const mTitle = `🔔 ${m.label}`;
        const mDesc = `Scheduled milestone alert for ${debt.personName}. Milestone date: ${m.date}. Alarm active.`;

        if (existingMIdx >= 0) {
          updatedEvents[existingMIdx] = {
            ...updatedEvents[existingMIdx],
            title: mTitle,
            description: mDesc,
            date: m.date,
            isCompleted: m.status === 'cleared',
            isAlarmEnabled: m.isAlarmEnabled,
            receivablePerson: debt.personName,
            amount: m.amount ?? debt.amount,
          };
        } else {
          updatedEvents.push({
            id: mEventId,
            title: mTitle,
            description: mDesc,
            date: m.date,
            time: '09:00',
            type: 'salary',
            color: '#8b5cf6',
            amount: m.amount ?? debt.amount,
            isCompleted: m.status === 'cleared',
            isAlarmEnabled: m.isAlarmEnabled,
            receivablePerson: debt.personName,
          });
        }
      });
    }

    // 2. Primary maturity date (e.g. 1 Dec 2026)
    if (debt.type === 'given_udhaar' && debt.expectedReturnDate) {
      const eventId = `evt-debt-${debt.id}`;
      const existingIdx = updatedEvents.findIndex(
        (e) => e.id === eventId || (e.receivablePerson === debt.personName && e.date === debt.expectedReturnDate)
      );

      const title = `🔔 1 Dec 2026: Collect Rs. ${debt.amount.toLocaleString('en-PK')} from ${debt.personName}`;
      const description = `Scheduled repayment collection for loan of Rs. ${debt.amount.toLocaleString('en-PK')}. Status: ${debt.status === 'cleared' ? 'Settled' : 'Pending Recovery'}.`;

      if (existingIdx >= 0) {
        updatedEvents[existingIdx] = {
          ...updatedEvents[existingIdx],
          title,
          description,
          date: debt.expectedReturnDate,
          amount: debt.amount,
          isCompleted: debt.status === 'cleared',
          isAlarmEnabled: true,
          receivablePerson: debt.personName,
        };
      } else {
        updatedEvents.push({
          id: eventId,
          title,
          description,
          date: debt.expectedReturnDate,
          time: '09:00',
          type: 'salary',
          color: '#10b981',
          amount: debt.amount,
          isCompleted: debt.status === 'cleared',
          isAlarmEnabled: true,
          receivablePerson: debt.personName,
        });
      }
    }
  });

  return updatedEvents;
}
