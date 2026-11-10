import { SalaryConfig } from '../types';

export interface SalaryBreakdown {
  grossAnnual: number;
  grossMonthly: number;
  grossPaycheck: number;
  federalTaxMonthly: number;
  stateTaxMonthly: number;
  ficaTaxMonthly: number;
  totalTaxesMonthly: number;
  retirement401kMonthly: number;
  healthInsuranceMonthly: number;
  otherDeductionsMonthly: number;
  totalDeductionsMonthly: number;
  bonusMonthly: number;
  overtimeMonthly: number;
  netMonthly: number;
  netAnnual: number;
  netPaycheck: number;
  effectiveTaxRate: number;
  takeHomePercentage: number;
}

export function calculateSalaryBreakdown(config: SalaryConfig): SalaryBreakdown {
  // Determine gross annual
  let grossAnnual = 0;
  if (config.payPeriod === 'annually') {
    grossAnnual = config.baseSalary;
  } else if (config.payPeriod === 'monthly') {
    grossAnnual = config.baseSalary * 12;
  } else if (config.payPeriod === 'biweekly') {
    grossAnnual = config.baseSalary * 26;
  } else if (config.payPeriod === 'hourly') {
    grossAnnual = config.baseSalary * config.hoursPerWeek * 52;
  }

  const grossMonthly = grossAnnual / 12;

  // Overtime computation (based on hourly equivalent)
  const hourlyRate = grossAnnual / (52 * config.hoursPerWeek);
  const overtimeMonthly =
    config.overtimeHoursPerMonth * hourlyRate * (config.overtimeMultiplier || 1.5);
  const bonusMonthly = config.bonusMonthlyAvg || 0;

  const totalTaxableBaseMonthly = grossMonthly + overtimeMonthly + bonusMonthly;

  // Pre-tax retirement 401(k) deduction
  const retirement401kMonthly = (grossMonthly * (config.retirement401kPct || 0)) / 100;
  const taxableForFederalMonthly = Math.max(0, totalTaxableBaseMonthly - retirement401kMonthly);

  // Tax calculations
  const federalTaxMonthly = (taxableForFederalMonthly * (config.federalTaxRate || 0)) / 100;
  const stateTaxMonthly = (taxableForFederalMonthly * (config.stateTaxRate || 0)) / 100;
  const ficaTaxMonthly = (totalTaxableBaseMonthly * (config.ficaTaxRate || 0)) / 100;

  const totalTaxesMonthly = federalTaxMonthly + stateTaxMonthly + ficaTaxMonthly;

  // Post-tax and other deductions
  const healthInsuranceMonthly = config.healthInsuranceMonthly || 0;
  const otherDeductionsMonthly = config.otherDeductionsMonthly || 0;
  const totalDeductionsMonthly =
    retirement401kMonthly + healthInsuranceMonthly + otherDeductionsMonthly;

  // Net Take-Home Monthly
  const netMonthly = Math.max(
    0,
    totalTaxableBaseMonthly - totalTaxesMonthly - healthInsuranceMonthly - otherDeductionsMonthly - retirement401kMonthly
  );

  const netAnnual = netMonthly * 12;

  // Net Paycheck based on frequency
  let paychecksPerYear = 12;
  if (config.payDayFrequency === 'semi-monthly') {
    paychecksPerYear = 24;
  } else if (config.payDayFrequency === 'bi-weekly') {
    paychecksPerYear = 26;
  }

  const grossPaycheck = (grossAnnual + (bonusMonthly + overtimeMonthly) * 12) / paychecksPerYear;
  const netPaycheck = netAnnual / paychecksPerYear;

  const effectiveTaxRate =
    totalTaxableBaseMonthly > 0 ? (totalTaxesMonthly / totalTaxableBaseMonthly) * 100 : 0;
  const takeHomePercentage =
    totalTaxableBaseMonthly > 0 ? (netMonthly / totalTaxableBaseMonthly) * 100 : 0;

  return {
    grossAnnual,
    grossMonthly,
    grossPaycheck,
    federalTaxMonthly,
    stateTaxMonthly,
    ficaTaxMonthly,
    totalTaxesMonthly,
    retirement401kMonthly,
    healthInsuranceMonthly,
    otherDeductionsMonthly,
    totalDeductionsMonthly,
    bonusMonthly,
    overtimeMonthly,
    netMonthly,
    netAnnual,
    netPaycheck,
    effectiveTaxRate,
    takeHomePercentage,
  };
}

/**
 * Project upcoming paydays for a given month and year
 */
export function getPaydaysForMonth(
  config: SalaryConfig,
  year: number,
  monthIndex: number // 0-11
): number[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const paydays: number[] = [];

  const clamp = (d: number) => Math.min(Math.max(1, d), daysInMonth);

  if (config.payDayFrequency === 'monthly') {
    paydays.push(clamp(config.payDayDate || 28));
  } else if (config.payDayFrequency === 'semi-monthly') {
    paydays.push(clamp(config.payDayDate || 1));
    if (config.payDayDateSecondary) {
      paydays.push(clamp(config.payDayDateSecondary));
    } else {
      paydays.push(clamp(15));
    }
  } else if (config.payDayFrequency === 'bi-weekly') {
    // Bi-weekly: alternate every 14 days starting from first payDayDate
    let current = clamp(config.payDayDate || 5);
    while (current <= daysInMonth) {
      paydays.push(current);
      current += 14;
    }
  }

  return paydays.sort((a, b) => a - b);
}

/**
 * Pakistan Federal Board of Revenue (FBR) Tax Slabs for Salaried Individuals
 * Tax Year 2024 - 2025 / 2026 (Income Tax Ordinance, 2001)
 */
export interface PakistanFBRTaxCalculation {
  annualGross: number;
  monthlyGross: number;
  annualTax: number;
  monthlyTax: number;
  eobiMonthly: number;
  netMonthlyTakeHome: number;
  slabDescription: string;
  taxBracketPct: number;
}

export function calculatePakistanFBRTax(monthlySalary: number): PakistanFBRTaxCalculation {
  const annualGross = monthlySalary * 12;
  let annualTax = 0;
  let slabDescription = 'Slab 1: Up to Rs. 600,000/year (Tax exempt - 0%)';
  let taxBracketPct = 0;

  if (annualGross <= 600000) {
    annualTax = 0;
    slabDescription = 'Slab 1: Up to Rs. 600,000/year (Tax exempt - 0%)';
    taxBracketPct = 0;
  } else if (annualGross <= 1200000) {
    // 5% of amount exceeding Rs. 600,000
    annualTax = (annualGross - 600000) * 0.05;
    slabDescription = 'Slab 2: Rs. 600,001 to Rs. 1,200,000 (5% on amount exceeding Rs. 600,000)';
    taxBracketPct = 5;
  } else if (annualGross <= 2200000) {
    // Rs. 30,000 + 15% of amount exceeding Rs. 1,200,000
    annualTax = 30000 + (annualGross - 1200000) * 0.15;
    slabDescription = 'Slab 3: Rs. 1,200,001 to Rs. 2,200,000 (Rs. 30,000 + 15% on excess)';
    taxBracketPct = 15;
  } else if (annualGross <= 3200000) {
    // Rs. 180,000 + 25% of amount exceeding Rs. 2,200,000
    annualTax = 180000 + (annualGross - 2200000) * 0.25;
    slabDescription = 'Slab 4: Rs. 2,200,001 to Rs. 3,200,000 (Rs. 180,000 + 25% on excess)';
    taxBracketPct = 25;
  } else if (annualGross <= 4100000) {
    // Rs. 430,000 + 30% of amount exceeding Rs. 3,200,000
    annualTax = 430000 + (annualGross - 3200000) * 0.30;
    slabDescription = 'Slab 5: Rs. 3,200,001 to Rs. 4,100,000 (Rs. 430,000 + 30% on excess)';
    taxBracketPct = 30;
  } else {
    // Rs. 700,000 + 35% of amount exceeding Rs. 4,100,000
    annualTax = 700000 + (annualGross - 4100000) * 0.35;
    slabDescription = 'Slab 6: Exceeding Rs. 4,100,000 (Rs. 700,000 + 35% on excess)';
    taxBracketPct = 35;
  }

  const monthlyTax = Math.round(annualTax / 12);
  const eobiMonthly = 650; // Pakistan EOBI standard employee contribution
  const netMonthlyTakeHome = monthlySalary - monthlyTax - eobiMonthly;

  return {
    annualGross,
    monthlyGross: monthlySalary,
    annualTax: Math.round(annualTax),
    monthlyTax,
    eobiMonthly,
    netMonthlyTakeHome: Math.max(0, netMonthlyTakeHome),
    slabDescription,
    taxBracketPct,
  };
}
