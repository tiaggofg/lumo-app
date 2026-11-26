import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmEstimatePayload,
  CreateMonthlyBudgetResponse,
  MonthlyBudgetDetail,
  MonthlyBudgetListItem,
  Transaction,
  TransactionPayload,
  TransactionStatus,
  TransactionType,
} from '../../core/models/api.models';

export interface TransactionFilters {
  type: TransactionType | null;
  status: TransactionStatus | null;
  categoryId: string | null;
  beneficiaryId: string | null;
  search: string;
}

const DEFAULT_FILTERS: TransactionFilters = {
  type: null,
  status: null,
  categoryId: null,
  beneficiaryId: null,
  search: '',
};

@Injectable({ providedIn: 'root' })
export class BudgetsStoreService {
  private readonly http = inject(HttpClient);

  readonly budgets = signal<MonthlyBudgetListItem[]>([]);
  readonly currentDetail = signal<MonthlyBudgetDetail | null>(null);
  readonly transactions = signal<Transaction[]>([]);
  readonly loadingList = signal<boolean>(false);
  readonly loadingDetail = signal<boolean>(false);
  readonly filters = signal<TransactionFilters>({ ...DEFAULT_FILTERS });

  async loadBudgets(): Promise<void> {
    this.loadingList.set(true);
    try {
      const list = await firstValueFrom(this.http.get<MonthlyBudgetListItem[]>('/api/v1/budgets'));
      this.budgets.set(list);
    } finally {
      this.loadingList.set(false);
    }
  }

  async createBudget(competenceMonth: string): Promise<CreateMonthlyBudgetResponse> {
    const created = await firstValueFrom(
      this.http.post<CreateMonthlyBudgetResponse>('/api/v1/budgets', { competenceMonth })
    );
    await this.loadBudgets();
    return created;
  }

  async deleteBudget(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/v1/budgets/${id}`));
    await this.loadBudgets();
  }

  async loadBudgetDetail(budgetId: string): Promise<void> {
    this.loadingDetail.set(true);
    try {
      const [detail, txns] = await Promise.all([
        firstValueFrom(this.http.get<MonthlyBudgetDetail>(`/api/v1/budgets/${budgetId}`)),
        this.fetchFilteredTransactions(budgetId, this.filters()),
      ]);
      this.currentDetail.set(detail);
      this.transactions.set(txns);
    } finally {
      this.loadingDetail.set(false);
    }
  }

  async updateFilters(budgetId: string, partial: Partial<TransactionFilters>): Promise<void> {
    const next = { ...this.filters(), ...partial };
    this.filters.set(next);
    const txns = await this.fetchFilteredTransactions(budgetId, next);
    this.transactions.set(txns);
  }

  async resetFilters(budgetId: string): Promise<void> {
    this.filters.set({ ...DEFAULT_FILTERS });
    const txns = await this.fetchFilteredTransactions(budgetId, this.filters());
    this.transactions.set(txns);
  }

  async createTransaction(budgetId: string, payload: TransactionPayload): Promise<Transaction> {
    const created = await firstValueFrom(
      this.http.post<Transaction>(`/api/v1/budgets/${budgetId}/transactions`, payload)
    );
    await this.loadBudgetDetail(budgetId);
    return created;
  }

  async updateTransaction(
    budgetId: string,
    transactionId: string,
    payload: TransactionPayload
  ): Promise<Transaction> {
    const updated = await firstValueFrom(
      this.http.put<Transaction>(`/api/v1/transactions/${transactionId}`, payload)
    );
    await this.loadBudgetDetail(budgetId);
    return updated;
  }

  async changeTransactionStatus(
    budgetId: string,
    transactionId: string,
    status: TransactionStatus,
    paymentDate?: string | null
  ): Promise<Transaction> {
    const updated = await firstValueFrom(
      this.http.patch<Transaction>(`/api/v1/transactions/${transactionId}/status`, {
        status,
        paymentDate: paymentDate ?? null,
      })
    );
    await this.loadBudgetDetail(budgetId);
    return updated;
  }

  async confirmEstimate(
    budgetId: string,
    transactionId: string,
    payload: ConfirmEstimatePayload
  ): Promise<Transaction> {
    const updated = await firstValueFrom(
      this.http.patch<Transaction>(`/api/v1/transactions/${transactionId}/confirm-estimate`, payload)
    );
    await this.loadBudgetDetail(budgetId);
    return updated;
  }

  async deleteTransaction(budgetId: string, transactionId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/v1/transactions/${transactionId}`));
    await this.loadBudgetDetail(budgetId);
  }

  private async fetchFilteredTransactions(
    budgetId: string,
    filters: TransactionFilters
  ): Promise<Transaction[]> {
    let params = new HttpParams();
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.beneficiaryId) params = params.set('beneficiaryId', filters.beneficiaryId);
    if (filters.search.trim()) params = params.set('search', filters.search.trim());

    return firstValueFrom(
      this.http.get<Transaction[]>(`/api/v1/budgets/${budgetId}/transactions`, { params })
    );
  }
}
