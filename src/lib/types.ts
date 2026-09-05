export type CustomerSegment = "personal" | "affluent" | "priority" | "sme";
export type AccountType = "savings" | "giro" | "deposit";
export type LoanType = "kta" | "kpr" | "kkb" | "kur" | "paylater";
export type CardBrand = "classic" | "gold" | "platinum";
export type WealthKind = "rdpu" | "rds" | "rdpt" | "bond" | "bancassurance";

export type TxType =
  | "atm_withdraw"
  | "atm_transfer"
  | "atm_deposit"
  | "debit_purchase"
  | "qris"
  | "bifast_in"
  | "bifast_out"
  | "skn"
  | "rtgs"
  | "va_payment"
  | "salary"
  | "interest"
  | "admin_fee"
  | "loan_disburse"
  | "loan_installment"
  | "cc_purchase"
  | "cc_payment"
  | "cc_cash_advance"
  | "cc_interest"
  | "wealth_buy"
  | "wealth_sell"
  | "wealth_dividend"
  | "ewallet_topup"
  | "bill_payment"
  | "tax";

export interface Cif {
  cif: string;
  name: string;
  dob: string;
  pob: string;
  nikMasked: string;
  npwpMasked: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  segment: CustomerSegment;
  kycStatus: "verified" | "update_required";
  riskRating: "low" | "medium" | "high";
  openedOn: string;
  branch: string;
  occupation: string;
  motherMaiden: string;
}

export interface SavingsAccount {
  accountNo: string;
  type: AccountType;
  product: string;
  currency: "IDR";
  openedOn: string;
  status: "active" | "dormant" | "blocked";
  interestRate: number;
  monthlyAvgTarget: number;
  tenorMonths?: number;
  aro?: boolean;
}

export interface LoanAccount {
  accountNo: string;
  type: LoanType;
  product: string;
  principal: number;
  tenorMonths: number;
  annualRate: number;
  startedOn: string;
  collateral?: string;
  status: "current" | "late" | "closed";
}

export interface CreditCard {
  cardNoMasked: string;
  last4: string;
  brand: CardBrand;
  product: string;
  limit: number;
  openedOn: string;
  status: "active" | "blocked" | "late";
  dueDay: number;
  paymentAccountNo: string;
}

export interface WealthPosition {
  id: string;
  kind: WealthKind;
  product: string;
  units: number;
  navAtBuy: number;
  boughtOn: string;
  risk: "low" | "medium" | "high";
}

export interface CustomerProfile {
  cif: Cif;
  savings: SavingsAccount[];
  loans: LoanAccount[];
  cards: CreditCard[];
  wealth: WealthPosition[];
}

export interface BankTransaction {
  id: string;
  bookedAt: string;
  accountNo: string;
  cif: string;
  type: TxType;
  channel: string;
  description: string;
  merchant?: string;
  location?: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  status: "success" | "pending" | "failed" | "reversed";
  reference: string;
}

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export interface SopDocument {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  summary: string;
  steps: string[];
  sla: string;
  channels: string[];
  exceptions: string[];
  products: string[];
}

export interface RetrievedSop {
  id: string;
  title: string;
  category: string;
  score: number;
  summary: string;
  steps: string[];
  sla: string;
}

export type GuardDecision = "allow" | "meta" | "refuse";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
}

export interface ChatTicket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  sla: string;
  unit: string;
}

export interface ChatMeta {
  guardrail: boolean;
  guardReason?: string;
  model: string;
  sops: RetrievedSop[];
  retrieved?: { id: string; kind: string; title: string; score: number }[];
  ragTotal?: number;
  rangeLabel?: string;
  customerName?: string;
  ticket?: ChatTicket;
}
