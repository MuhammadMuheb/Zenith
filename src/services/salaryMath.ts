import { SalaryBreakdownConfig } from '../types';

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
    annualTax = (annualGross - 600000) * 0.05;
    slabDescription = 'Slab 2: Rs. 600,001 to Rs. 1,200,000 (5% on amount exceeding Rs. 600,000)';
    taxBracketPct = 5;
  } else if (annualGross <= 2200000) {
    annualTax = 30000 + (annualGross - 1200000) * 0.15;
    slabDescription = 'Slab 3: Rs. 1,200,001 to Rs. 2,200,000 (Rs. 30,000 + 15% on excess)';
    taxBracketPct = 15;
  } else if (annualGross <= 3200000) {
    annualTax = 180000 + (annualGross - 2200000) * 0.25;
    slabDescription = 'Slab 4: Rs. 2,200,001 to Rs. 3,200,000 (Rs. 180,000 + 25% on excess)';
    taxBracketPct = 25;
  } else if (annualGross <= 4100000) {
    annualTax = 430000 + (annualGross - 3200000) * 0.30;
    slabDescription = 'Slab 5: Rs. 3,200,001 to Rs. 4,100,000 (Rs. 430,000 + 30% on excess)';
    taxBracketPct = 30;
  } else {
    annualTax = 700000 + (annualGross - 4100000) * 0.35;
    slabDescription = 'Slab 6: Exceeding Rs. 4,100,000 (Rs. 700,000 + 35% on excess)';
    taxBracketPct = 35;
  }

  const monthlyTax = Math.round(annualTax / 12);
  const eobiMonthly = 650;
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

export function computeQuickTakeHome(config: SalaryBreakdownConfig): number {
  const base = config.baseSalary || 0;
  const tax = (base * (config.taxRatePercent || 0)) / 100;
  const pf = (base * (config.providentFundPercent || 0)) / 100;
  const other = config.otherDeductions || 0;
  const additions = (config.medicalAllowance || 0) + (config.bonusExpected || 0);
  return Math.max(0, base - tax - pf - other + additions);
}
