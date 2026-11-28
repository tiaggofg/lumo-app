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

  it('should enable search on category and beneficiary selects while keeping type and status non-searchable', () => {
    catalogStore.categories.set([
      { id: 'c-1', name: 'Moradia', type: 'EXPENSE', color: '#6366F1', icon: null, active: true, createdAt: '', updatedAt: '' },
      { id: 'c-2', name: 'Alimentação', type: 'EXPENSE', color: '#0284C7', icon: null, active: true, createdAt: '', updatedAt: '' },
    ]);
    catalogStore.beneficiaries.set([
      { id: 'b-1', name: 'Família', active: true, createdAt: '', updatedAt: '' },
      { id: 'b-2', name: 'Cônjuge', active: true, createdAt: '', updatedAt: '' },
    ]);

    const fixture = TestBed.createComponent(TransactionFormDrawerComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('transaction', null);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;

    // Type select: non-searchable
    const typeTrigger = host.querySelector('#txn-type') as HTMLButtonElement;
    typeTrigger.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="z-select-search"]')).toBeNull();
    typeTrigger.click();
    fixture.detectChanges();

    // Status select: non-searchable
    const statusTrigger = host.querySelector('#txn-status') as HTMLButtonElement;
    statusTrigger.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="z-select-search"]')).toBeNull();
    statusTrigger.click();
    fixture.detectChanges();

    // Category select: searchable + accent-insensitive filter
    const catTrigger = host.querySelector('#txn-category') as HTMLButtonElement;
    catTrigger.click();
    fixture.detectChanges();
    const catSearch = host.querySelector('[data-testid="z-select-search"]') as HTMLInputElement;
    expect(catSearch).toBeTruthy();
    catSearch.value = 'alimentacao';
    catSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const catItems = host.querySelectorAll('[role="option"]');
    expect(catItems).toHaveLength(1);
    expect(catItems[0].textContent).toContain('Alimentação');
    catTrigger.click();
    fixture.detectChanges();

    // Beneficiary select: searchable + accent-insensitive filter
    const benTrigger = host.querySelector('#txn-beneficiary') as HTMLButtonElement;
    benTrigger.click();
    fixture.detectChanges();
    const benSearch = host.querySelector('[data-testid="z-select-search"]') as HTMLInputElement;
    expect(benSearch).toBeTruthy();
    benSearch.value = 'conjuge';
    benSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const benItems = host.querySelectorAll('[role="option"]');
    expect(benItems).toHaveLength(1);
    expect(benItems[0].textContent).toContain('Cônjuge');
  });
});
