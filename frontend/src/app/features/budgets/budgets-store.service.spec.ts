import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BudgetsStoreService } from './budgets-store.service';

describe('BudgetsStoreService', () => {
  let store: BudgetsStoreService;
  let httpMock: HttpTestingController;

  const emptyDetail = {
    id: 'b-1',
    competenceMonth: '2026-11',
    summary: {
      plannedIncome: 0,
      realizedIncome: 0,
      plannedExpense: 100,
      realizedExpense: 100,
      plannedBalance: -100,
      realizedBalance: -100,
    },
    statusCounts: { estimated: 0, pending: 0, settled: 1 },
    expensesByCategory: [],
    expensesByBeneficiary: [],
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(BudgetsStoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send filter query params and reset filters', async () => {
    const promise = store.updateFilters('b-1', {
      type: 'EXPENSE',
      status: 'ESTIMATED',
      categoryId: 'c1',
      beneficiaryId: 'ben1',
      search: 'água',
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/v1/budgets/b-1/transactions' &&
        r.params.get('type') === 'EXPENSE' &&
        r.params.get('status') === 'ESTIMATED' &&
        r.params.get('categoryId') === 'c1' &&
        r.params.get('beneficiaryId') === 'ben1' &&
        r.params.get('search') === 'água'
    );
    req.flush([]);
    await promise;

    const resetPromise = store.resetFilters('b-1');
    httpMock.expectOne('/api/v1/budgets/b-1/transactions').flush([]);
    await resetPromise;
    expect(store.filters().search).toBe('');
  });

  it('should support budget and transaction mutations refreshing detail', async () => {
    const createB = store.createBudget('2026-11');
    httpMock.expectOne('/api/v1/budgets').flush({ id: 'b-1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/budgets').flush([]);
    await createB;

    const delB = store.deleteBudget('b-1');
    httpMock.expectOne('/api/v1/budgets/b-1').flush(null);
    await Promise.resolve();
    httpMock.expectOne('/api/v1/budgets').flush([]);
    await delB;

    const createT = store.createTransaction('b-1', {
      type: 'EXPENSE',
      description: 'Aluguel',
      amount: 800,
      status: 'PENDING',
    });
    httpMock.expectOne('/api/v1/budgets/b-1/transactions').flush({ id: 't-1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/budgets/b-1').flush(emptyDetail);
    httpMock.expectOne('/api/v1/budgets/b-1/transactions').flush([]);
    await createT;

    const updateT = store.updateTransaction('b-1', 't-1', {
      type: 'EXPENSE',
      description: 'Aluguel 2',
      amount: 850,
      status: 'PENDING',
    });
    httpMock.expectOne('/api/v1/transactions/t-1').flush({ id: 't-1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/budgets/b-1').flush(emptyDetail);
    httpMock.expectOne('/api/v1/budgets/b-1/transactions').flush([]);
    await updateT;

    const statusT = store.changeTransactionStatus('b-1', 't-1', 'SETTLED');
    httpMock.expectOne('/api/v1/transactions/t-1/status').flush({ id: 't-1', status: 'SETTLED' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/budgets/b-1').flush(emptyDetail);
    httpMock.expectOne('/api/v1/budgets/b-1/transactions').flush([]);
    await statusT;

    const estT = store.confirmEstimate('b-1', 't-1', { amount: 195.64, targetStatus: 'PENDING' });
    httpMock.expectOne('/api/v1/transactions/t-1/confirm-estimate').flush({ id: 't-1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/budgets/b-1').flush(emptyDetail);
    httpMock.expectOne('/api/v1/budgets/b-1/transactions').flush([]);
    await estT;

    const delT = store.deleteTransaction('b-1', 't-1');
    httpMock.expectOne('/api/v1/transactions/t-1').flush(null);
    await Promise.resolve();
    httpMock.expectOne('/api/v1/budgets/b-1').flush(emptyDetail);
    httpMock.expectOne('/api/v1/budgets/b-1/transactions').flush([]);
    await delT;

    expect(store.currentDetail()?.summary.realizedExpense).toBe(100);
  });
});
