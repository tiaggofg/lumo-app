import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CreateRecurrenceResponse,
  DeactivateRecurrenceResponse,
  RecurrenceType,
  RecurringTransaction,
  RecurringTransactionPayload,
  TransactionType,
  UpdateRecurrenceResponse,
} from '../../core/models/api.models';

export interface RecurrenceFilters {
  active: boolean | null;
  type: TransactionType | null;
  recurrenceType: RecurrenceType | null;
}

@Injectable({ providedIn: 'root' })
export class RecurrencesStoreService {
  private readonly http = inject(HttpClient);

  readonly recurrences = signal<RecurringTransaction[]>([]);
  readonly loading = signal<boolean>(false);
  readonly filters = signal<RecurrenceFilters>({
    active: null,
    type: null,
    recurrenceType: null,
  });

  async loadRecurrences(): Promise<void> {
    this.loading.set(true);
    try {
      const f = this.filters();
      let params = new HttpParams();
      if (f.active !== null) params = params.set('active', String(f.active));
      if (f.type) params = params.set('type', f.type);
      if (f.recurrenceType) params = params.set('recurrenceType', f.recurrenceType);

      const list = await firstValueFrom(
        this.http.get<RecurringTransaction[]>('/api/v1/recurring-transactions', { params })
      );
      this.recurrences.set(list);
    } finally {
      this.loading.set(false);
    }
  }

  async updateFilters(partial: Partial<RecurrenceFilters>): Promise<void> {
    this.filters.set({ ...this.filters(), ...partial });
    await this.loadRecurrences();
  }

  async create(payload: RecurringTransactionPayload): Promise<CreateRecurrenceResponse> {
    const res = await firstValueFrom(
      this.http.post<CreateRecurrenceResponse>('/api/v1/recurring-transactions', payload)
    );
    await this.loadRecurrences();
    return res;
  }

  async update(id: string, payload: RecurringTransactionPayload): Promise<UpdateRecurrenceResponse> {
    const res = await firstValueFrom(
      this.http.put<UpdateRecurrenceResponse>(`/api/v1/recurring-transactions/${id}`, payload)
    );
    await this.loadRecurrences();
    return res;
  }

  async deactivate(
    id: string,
    removeFutureOpenTransactions: boolean
  ): Promise<DeactivateRecurrenceResponse> {
    const res = await firstValueFrom(
      this.http.patch<DeactivateRecurrenceResponse>(
        `/api/v1/recurring-transactions/${id}/deactivate`,
        { removeFutureOpenTransactions }
      )
    );
    await this.loadRecurrences();
    return res;
  }

  async activate(id: string): Promise<RecurringTransaction> {
    const res = await firstValueFrom(
      this.http.patch<RecurringTransaction>(`/api/v1/recurring-transactions/${id}/activate`, {})
    );
    await this.loadRecurrences();
    return res;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/v1/recurring-transactions/${id}`));
    await this.loadRecurrences();
  }
}
