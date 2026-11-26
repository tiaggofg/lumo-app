import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogStoreService } from './catalog-store.service';

describe('CatalogStoreService', () => {
  let store: CatalogStoreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(CatalogStoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should filter active categories by type and active beneficiaries', async () => {
    const loadPromise = store.loadAll();

    httpMock.expectOne('/api/v1/categories').flush([
      { id: '1', name: 'Moradia', type: 'EXPENSE', color: '#6366F1', icon: null, active: true, createdAt: '', updatedAt: '' },
      { id: '2', name: 'Inativa', type: 'EXPENSE', color: null, icon: null, active: false, createdAt: '', updatedAt: '' },
      { id: '3', name: 'Salário', type: 'INCOME', color: '#22C55E', icon: null, active: true, createdAt: '', updatedAt: '' },
    ]);
    httpMock.expectOne('/api/v1/beneficiaries').flush([
      { id: 'b1', name: 'Família', active: true, createdAt: '', updatedAt: '' },
      { id: 'b2', name: 'Antigo', active: false, createdAt: '', updatedAt: '' },
    ]);

    await loadPromise;

    expect(store.activeExpenseCategories().map((c) => c.name)).toEqual(['Moradia']);
    expect(store.activeIncomeCategories().map((c) => c.name)).toEqual(['Salário']);
    expect(store.activeBeneficiaries().map((b) => b.name)).toEqual(['Família']);
  });

  it('should support full CRUD for categories and beneficiaries', async () => {
    const p1 = store.createCategory({ name: 'Pets', type: 'EXPENSE' });
    httpMock.expectOne('/api/v1/categories').flush({ id: 'c1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/categories').flush([]);
    await p1;

    const p2 = store.updateCategory('c1', { name: 'Animais' });
    httpMock.expectOne('/api/v1/categories/c1').flush({ id: 'c1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/categories').flush([]);
    await p2;

    const p3 = store.toggleCategoryStatus('c1', false);
    httpMock.expectOne('/api/v1/categories/c1/status').flush({ id: 'c1', active: false });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/categories').flush([]);
    await p3;

    const p4 = store.deleteCategory('c1');
    httpMock.expectOne('/api/v1/categories/c1').flush(null);
    await Promise.resolve();
    httpMock.expectOne('/api/v1/categories').flush([]);
    await p4;

    const p5 = store.createBeneficiary('Tiago');
    httpMock.expectOne('/api/v1/beneficiaries').flush({ id: 'b1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/beneficiaries').flush([]);
    await p5;

    const p6 = store.updateBeneficiary('b1', 'Tiago G.');
    httpMock.expectOne('/api/v1/beneficiaries/b1').flush({ id: 'b1' });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/beneficiaries').flush([]);
    await p6;

    const p7 = store.toggleBeneficiaryStatus('b1', false);
    httpMock.expectOne('/api/v1/beneficiaries/b1/status').flush({ id: 'b1', active: false });
    await Promise.resolve();
    httpMock.expectOne('/api/v1/beneficiaries').flush([]);
    await p7;

    const p8 = store.deleteBeneficiary('b1');
    httpMock.expectOne('/api/v1/beneficiaries/b1').flush(null);
    await Promise.resolve();
    httpMock.expectOne('/api/v1/beneficiaries').flush([]);
    await p8;
  });
});
