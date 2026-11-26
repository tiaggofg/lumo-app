import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Transaction } from '../../core/models/api.models';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { BudgetDetailPageComponent } from './budget-detail-page.component';
import { BudgetsStoreService } from './budgets-store.service';

describe('BudgetDetailPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<BudgetDetailPageComponent>;
  let component: BudgetDetailPageComponent;
  let store: BudgetsStoreService;
  let catalogStore: CatalogStoreService;
  let confirmationService: ConfirmationService;

  const sampleTxn: Transaction = {
    id: 't1',
    monthlyBudgetId: 'b1',
    type: 'EXPENSE',
    description: 'Água',
    amount: 180,
    status: 'ESTIMATED',
    dueDate: '2026-11-20',
    paymentDate: null,
    notes: 'conta mensal',
    categoryId: 'c1',
    categoryName: 'Contas Básicas',
    categoryColor: '#0EA5E9',
    beneficiaryId: 'ben1',
    beneficiaryName: 'Família',
    sourceRecurringTransactionId: 'r1',
    installmentCurrent: 4,
    installmentTotal: 6,
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BudgetDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfirmationService,
        MessageService,
      ],
    });
    fixture = TestBed.createComponent(BudgetDetailPageComponent);
    fixture.componentRef.setInput('id', 'b1');
    component = fixture.componentInstance;
    store = TestBed.inject(BudgetsStoreService);
    catalogStore = TestBed.inject(CatalogStoreService);
    confirmationService = TestBed.inject(ConfirmationService);
  });

  it('should render summary, transactions and delegate actions to store', async () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadBudgetDetail').mockResolvedValue();
    fixture.detectChanges();

    store.currentDetail.set({
      id: 'b1',
      competenceMonth: '2026-11',
      summary: {
        plannedIncome: 6362.29,
        realizedIncome: 6362.29,
        plannedExpense: 1000,
        realizedExpense: 500,
        plannedBalance: 5362.29,
        realizedBalance: 5862.29,
      },
      statusCounts: { estimated: 1, pending: 0, settled: 1 },
      expensesByCategory: [],
      expensesByBeneficiary: [],
      createdAt: '',
      updatedAt: '',
    });
    store.transactions.set([sampleTxn]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Novembro 2026');
    expect(fixture.nativeElement.textContent).toContain('Água');
    expect(component.expensePaidPercent()).toBe(50);

    const filterSpy = vi.spyOn(store, 'updateFilters').mockResolvedValue();
    const resetSpy = vi.spyOn(store, 'resetFilters').mockResolvedValue();
    component.setTypeTab('EXPENSE');
    component.onFilterChange({ search: 'água' });
    component.clearFilters();
    expect(filterSpy).toHaveBeenCalledTimes(2);
    expect(resetSpy).toHaveBeenCalledWith('b1');

    const statusSpy = vi.spyOn(store, 'changeTransactionStatus').mockResolvedValue(sampleTxn);
    await component.toggleSettle(sampleTxn);
    expect(statusSpy).toHaveBeenCalledWith('b1', 't1', 'SETTLED');

    const createSpy = vi.spyOn(store, 'createTransaction').mockResolvedValue(sampleTxn);
    component.openCreateDrawer();
    fixture.detectChanges();
    await component.onTransactionSaved({
      type: 'EXPENSE',
      description: 'Aluguel',
      amount: 800,
      status: 'PENDING',
    });
    expect(createSpy).toHaveBeenCalled();

    const updateSpy = vi.spyOn(store, 'updateTransaction').mockResolvedValue(sampleTxn);
    component.openEditDrawer(sampleTxn);
    fixture.detectChanges();
    await component.onTransactionSaved({
      type: 'EXPENSE',
      description: 'Água Edit',
      amount: 190,
      status: 'PENDING',
    });
    expect(updateSpy).toHaveBeenCalled();

    const confirmEstSpy = vi.spyOn(store, 'confirmEstimate').mockResolvedValue(sampleTxn);
    component.openConfirmEstimate(sampleTxn);
    fixture.detectChanges();
    await component.onEstimateConfirmed({ amount: 195.64, targetStatus: 'PENDING' });
    expect(confirmEstSpy).toHaveBeenCalled();

    const confirmSpy = vi.spyOn(confirmationService, 'confirm');
    component.confirmDeleteTransaction(sampleTxn);
    expect(confirmSpy).toHaveBeenCalled();
  });
});
