import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Transaction } from '../../core/models/api.models';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { TransactionFormDrawerComponent } from './transaction-form-drawer.component';

describe('TransactionFormDrawerComponent', () => {
  let catalogStore: CatalogStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TransactionFormDrawerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    catalogStore = TestBed.inject(CatalogStoreService);
    catalogStore.categories.set([
      { id: 'c-exp', name: 'Moradia', type: 'EXPENSE', color: '#6366F1', icon: null, active: true, createdAt: '', updatedAt: '' },
      { id: 'c-inc', name: 'Salário', type: 'INCOME', color: '#22C55E', icon: null, active: true, createdAt: '', updatedAt: '' },
      { id: 'c-old', name: 'Antiga', type: 'EXPENSE', color: null, icon: null, active: false, createdAt: '', updatedAt: '' },
    ]);
    catalogStore.beneficiaries.set([
      { id: 'b-act', name: 'Família', active: true, createdAt: '', updatedAt: '' },
      { id: 'b-old', name: 'Antigo', active: false, createdAt: '', updatedAt: '' },
    ]);
  });

  it('should filter categories by type, validate amount > 0 and emit payload', () => {
    const fixture = TestBed.createComponent(TransactionFormDrawerComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('transaction', null);
    fixture.detectChanges();

    expect(component.isValid()).toBe(false);
    expect(component.availableCategories().map((c) => c.id)).toEqual(['c-exp']);

    component.form.type = 'INCOME';
    component.onTypeChange();
    expect(component.form.categoryId).toBeNull();

    component.form.description = 'Salário';
    component.form.amount = 6362.29;
    component.form.categoryId = 'c-inc';
    expect(component.isValid()).toBe(true);

    const emitted: unknown[] = [];
    component.saved.subscribe((p) => emitted.push(p));
    component.submit();
    expect(emitted).toHaveLength(1);
  });

  it('should retain inactive category/beneficiary when editing existing transaction', () => {
    const fixture = TestBed.createComponent(TransactionFormDrawerComponent);
    const component = fixture.componentInstance;
    const existing: Transaction = {
      id: 't1',
      monthlyBudgetId: 'b1',
      type: 'EXPENSE',
      description: 'Antigo',
      amount: 100,
      status: 'PENDING',
      dueDate: '2026-11-10',
      paymentDate: null,
      notes: 'obs',
      categoryId: 'c-old',
      categoryName: 'Antiga',
      categoryColor: null,
      beneficiaryId: 'b-old',
      beneficiaryName: 'Antigo',
      sourceRecurringTransactionId: null,
      installmentCurrent: null,
      installmentTotal: null,
      createdAt: '',
      updatedAt: '',
    };
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('transaction', existing);
    fixture.detectChanges();

    expect(component.availableCategories().map((c) => c.id)).toContain('c-old');
    expect(component.availableBeneficiaries().map((b) => b.id)).toContain('b-old');
  });
});
