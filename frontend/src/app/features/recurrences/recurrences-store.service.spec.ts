import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RecurrencesStoreService } from './recurrences-store.service';

describe('RecurrencesStoreService', () => {
  let store: RecurrencesStoreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(RecurrencesStoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should apply query filters when loading recurrences', async () => {
    const promise = store.updateFilters({ active: true, type: 'EXPENSE', recurrenceType: 'FIXED_TERM' });

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/api/v1/recurring-transactions' &&
        r.params.get('active') === 'true' &&
        r.params.get('type') === 'EXPENSE' &&
        r.params.get('recurrenceType') === 'FIXED_TERM'
    );
    req.flush([]);
    await promise;
    expect(store.recurrences()).toEqual([]);
  });

  it('should create, update, deactivate, activate and delete recurrences', async () => {
    const createPromise = store.create({
      type: 'EXPENSE',
      description: 'Aluguel',
      amount: 800,
      amountType: 'FIXED',
      recurrenceType: 'INDEFINITE',
      startMonth: '2026-11',
    });
    httpMock.expectOne('/api/v1/recurring-transactions').flush({ recurrence: { id: 'r1' }, materializedBudgetIds: [] });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/recurring-transactions').flush([]);
    await createPromise;

    const updatePromise = store.update('r1', {
      type: 'EXPENSE',
      description: 'Aluguel 2',
      amount: 850,
      amountType: 'FIXED',
      recurrenceType: 'INDEFINITE',
      startMonth: '2026-11',
      propagateToOpenTransactions: true,
    });
    httpMock.expectOne('/api/v1/recurring-transactions/r1').flush({ recurrence: { id: 'r1' }, propagatedCount: 1 });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/recurring-transactions').flush([]);
    await updatePromise;

    const deactivatePromise = store.deactivate('r1', true);
    httpMock.expectOne('/api/v1/recurring-transactions/r1/deactivate').flush({ recurrence: { id: 'r1', active: false }, removedTransactionsCount: 1 });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/recurring-transactions').flush([]);
    await deactivatePromise;

    const activatePromise = store.activate('r1');
    httpMock.expectOne('/api/v1/recurring-transactions/r1/activate').flush({ id: 'r1', active: true });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/recurring-transactions').flush([]);
    await activatePromise;

    const deletePromise = store.delete('r1');
    httpMock.expectOne('/api/v1/recurring-transactions/r1').flush(null);
    await Promise.resolve();
    httpMock.expectOne('/api/v1/recurring-transactions').flush([]);
    await deletePromise;
  });
});
