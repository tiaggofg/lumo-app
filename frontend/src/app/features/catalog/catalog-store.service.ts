import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Beneficiary, Category, TransactionType } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class CatalogStoreService {
  private readonly http = inject(HttpClient);

  readonly categories = signal<Category[]>([]);
  readonly beneficiaries = signal<Beneficiary[]>([]);
  readonly loadingCategories = signal<boolean>(false);
  readonly loadingBeneficiaries = signal<boolean>(false);

  readonly activeExpenseCategories = computed(() =>
    this.categories().filter((c) => c.active && c.type === 'EXPENSE')
  );

  readonly activeIncomeCategories = computed(() =>
    this.categories().filter((c) => c.active && c.type === 'INCOME')
  );

  readonly activeBeneficiaries = computed(() => this.beneficiaries().filter((b) => b.active));

  async loadAll(): Promise<void> {
    await Promise.all([this.loadCategories(), this.loadBeneficiaries()]);
  }

  async loadCategories(): Promise<void> {
    this.loadingCategories.set(true);
    try {
      const list = await firstValueFrom(this.http.get<Category[]>('/api/v1/categories'));
      this.categories.set(list);
    } finally {
      this.loadingCategories.set(false);
    }
  }

  async createCategory(payload: {
    name: string;
    type: TransactionType;
    color?: string | null;
    icon?: string | null;
  }): Promise<Category> {
    const created = await firstValueFrom(this.http.post<Category>('/api/v1/categories', payload));
    await this.loadCategories();
    return created;
  }

  async updateCategory(
    id: string,
    payload: { name: string; color?: string | null; icon?: string | null }
  ): Promise<Category> {
    const updated = await firstValueFrom(
      this.http.put<Category>(`/api/v1/categories/${id}`, payload)
    );
    await this.loadCategories();
    return updated;
  }

  async toggleCategoryStatus(id: string, active: boolean): Promise<Category> {
    const updated = await firstValueFrom(
      this.http.patch<Category>(`/api/v1/categories/${id}/status`, { active })
    );
    await this.loadCategories();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/v1/categories/${id}`));
    await this.loadCategories();
  }

  async loadBeneficiaries(): Promise<void> {
    this.loadingBeneficiaries.set(true);
    try {
      const list = await firstValueFrom(this.http.get<Beneficiary[]>('/api/v1/beneficiaries'));
      this.beneficiaries.set(list);
    } finally {
      this.loadingBeneficiaries.set(false);
    }
  }

  async createBeneficiary(name: string): Promise<Beneficiary> {
    const created = await firstValueFrom(
      this.http.post<Beneficiary>('/api/v1/beneficiaries', { name })
    );
    await this.loadBeneficiaries();
    return created;
  }

  async updateBeneficiary(id: string, name: string): Promise<Beneficiary> {
    const updated = await firstValueFrom(
      this.http.put<Beneficiary>(`/api/v1/beneficiaries/${id}`, { name })
    );
    await this.loadBeneficiaries();
    return updated;
  }

  async toggleBeneficiaryStatus(id: string, active: boolean): Promise<Beneficiary> {
    const updated = await firstValueFrom(
      this.http.patch<Beneficiary>(`/api/v1/beneficiaries/${id}/status`, { active })
    );
    await this.loadBeneficiaries();
    return updated;
  }

  async deleteBeneficiary(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/v1/beneficiaries/${id}`));
    await this.loadBeneficiaries();
  }
}
