import type { LoanAccount } from "../types";

export function installment(loan: LoanAccount): number {
  const r = loan.annualRate / 12;
  const n = loan.tenorMonths;
  if (r === 0) return Math.round(loan.principal / n);
  return Math.round(
    (loan.principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1),
  );
}
