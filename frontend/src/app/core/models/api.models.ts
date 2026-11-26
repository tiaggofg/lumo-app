export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'ESTIMATED' | 'PENDING' | 'SETTLED';
export type RecurrenceType = 'INDEFINITE' | 'FIXED_TERM' | 'INSTALLMENT';
export type RecurrenceAmountType = 'FIXED' | 'ESTIMATED';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: { field: string; message: string }[];
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  plannedIncome: number;
  realizedIncome: number;
  plannedExpense: number;
  realizedExpense: number;
  plannedBalance: number;
  realizedBalance: number;
}

export interface StatusCounts {
  estimated: number;
  pending: number;
  settled: number;
}

export interface BreakdownItem {
  id: string | null;
  name: string;
  color: string | null;
  plannedAmount: number;
  realizedAmount: number;
  count: number;
}

export interface MonthlyBudgetListItem {
  id: string;
  competenceMonth: string;
  summary: BudgetSummary;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudgetDetail {
  id: string;
  competenceMonth: string;
  summary: BudgetSummary;
  statusCounts: StatusCounts;
  expensesByCategory: BreakdownItem[];
  expensesByBeneficiary: BreakdownItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonthlyBudgetResponse {
  id: string;
  competenceMonth: string;
  materializedCount: number;
  summary: BudgetSummary;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  monthlyBudgetId: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  dueDate: string | null;
  paymentDate: string | null;
  notes: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  beneficiaryId: string | null;
  beneficiaryName: string | null;
  sourceRecurringTransactionId: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionPayload {
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  dueDate?: string | null;
  paymentDate?: string | null;
  notes?: string | null;
  categoryId?: string | null;
  beneficiaryId?: string | null;
}

export interface ConfirmEstimatePayload {
  amount: number;
  targetStatus: 'PENDING' | 'SETTLED';
  paymentDate?: string | null;
  updateRecurringTemplate?: boolean;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  amountType: RecurrenceAmountType;
  recurrenceType: RecurrenceType;
  startMonth: string;
  endMonth: string | null;
  totalInstallments: number | null;
  startingInstallment: number | null;
  dueDay: number | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  beneficiaryId: string | null;
  beneficiaryName: string | null;
  notes: string | null;
  active: boolean;
  hasGeneratedTransactions: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransactionPayload {
  type: TransactionType;
  description: string;
  amount: number;
  amountType: RecurrenceAmountType;
  recurrenceType: RecurrenceType;
  startMonth: string;
  endMonth?: string | null;
  totalInstallments?: number | null;
  startingInstallment?: number | null;
  dueDay?: number | null;
  categoryId?: string | null;
  beneficiaryId?: string | null;
  notes?: string | null;
  propagateToOpenTransactions?: boolean;
}

export interface CreateRecurrenceResponse {
  recurrence: RecurringTransaction;
  materializedBudgetIds: string[];
}

export interface UpdateRecurrenceResponse {
  recurrence: RecurringTransaction;
  propagatedCount: number;
}

export interface DeactivateRecurrenceResponse {
  recurrence: RecurringTransaction;
  removedTransactionsCount: number;
}
