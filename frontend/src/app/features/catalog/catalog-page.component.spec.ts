import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ZConfirmService } from '../../shared/ui';
import { CatalogPageComponent } from './catalog-page.component';
import { CatalogStoreService } from './catalog-store.service';

describe('CatalogPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<CatalogPageComponent>;
  let component: CatalogPageComponent;
  let store: CatalogStoreService;
  let httpMock: HttpTestingController;
  let confirmService: ZConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CatalogPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(CatalogPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(CatalogStoreService);
    httpMock = TestBed.inject(HttpTestingController);
    confirmService = TestBed.inject(ZConfirmService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should render tabs, open dialogs, filter categories and invoke store CRUD methods', async () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/categories').flush([
      { id: 'c1', name: 'Moradia', type: 'EXPENSE', color: '#6366F1', icon: 'pi pi-home', active: true, createdAt: '', updatedAt: '' },
      { id: 'c2', name: 'Salário', type: 'INCOME', color: '#22C55E', icon: 'pi pi-wallet', active: false, createdAt: '', updatedAt: '' },
    ]);
    httpMock.expectOne('/api/v1/beneficiaries').flush([
      { id: 'b1', name: 'Família', active: true, createdAt: '', updatedAt: '' },
      { id: 'b2', name: 'Inativo', active: false, createdAt: '', updatedAt: '' },
    ]);
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Moradia');

    component.categoryTypeFilter.set('EXPENSE');
    fixture.detectChanges();
    expect(component.filteredCategories().map((c) => c.name)).toEqual(['Moradia']);

    // Create category dialog rendered
    component.openCategoryDialog();
    fixture.detectChanges();
    expect(component.categoryForm.color).toBe('#4F46E5');
    component.categoryForm.name = 'Pets';
    const saveCatSpy = vi.spyOn(store, 'createCategory').mockResolvedValue(store.categories()[0]);
    await component.saveCategory();
    expect(saveCatSpy).toHaveBeenCalled();

    // Update category
    component.openCategoryDialog(store.categories()[0]);
    fixture.detectChanges();
    const updateCatSpy = vi.spyOn(store, 'updateCategory').mockResolvedValue(store.categories()[0]);
    await component.saveCategory();
    expect(updateCatSpy).toHaveBeenCalled();

    // Toggle category
    const toggleCatSpy = vi.spyOn(store, 'toggleCategoryStatus').mockResolvedValue(store.categories()[0]);
    await component.toggleCategory(store.categories()[0]);
    expect(toggleCatSpy).toHaveBeenCalledWith('c1', false);

    // Confirm delete category
    const confirmSpy = vi.spyOn(confirmService, 'confirm');
    component.confirmDeleteCategory(store.categories()[0]);
    expect(confirmSpy).toHaveBeenCalled();

    // Switch to beneficiaries tab and render
    component.activeTab.set('beneficiaries');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Família');

    // Create & update beneficiary
    component.openBeneficiaryDialog();
    fixture.detectChanges();
    component.beneficiaryName = 'Tiago';
    const createBenSpy = vi.spyOn(store, 'createBeneficiary').mockResolvedValue(store.beneficiaries()[0]);
    await component.saveBeneficiary();
    expect(createBenSpy).toHaveBeenCalledWith('Tiago');

    component.openBeneficiaryDialog(store.beneficiaries()[0]);
    fixture.detectChanges();
    const updateBenSpy = vi.spyOn(store, 'updateBeneficiary').mockResolvedValue(store.beneficiaries()[0]);
    await component.saveBeneficiary();
    expect(updateBenSpy).toHaveBeenCalled();

    const toggleBenSpy = vi.spyOn(store, 'toggleBeneficiaryStatus').mockResolvedValue(store.beneficiaries()[0]);
    await component.toggleBeneficiary(store.beneficiaries()[0]);
    expect(toggleBenSpy).toHaveBeenCalledWith('b1', false);

    component.confirmDeleteBeneficiary(store.beneficiaries()[0]);
    expect(confirmSpy).toHaveBeenCalledTimes(2);

    expect(fixture.nativeElement.innerHTML).not.toContain('emerald-');
  });
});
