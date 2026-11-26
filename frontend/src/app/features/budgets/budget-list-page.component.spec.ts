import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BudgetListPageComponent } from './budget-list-page.component';
import { BudgetsStoreService } from './budgets-store.service';

describe('BudgetListPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<BudgetListPageComponent>;
  let component: BudgetListPageComponent;
  let store: BudgetsStoreService;
  let router: Router;
  let httpMock: HttpTestingController;
  let confirmationService: ConfirmationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BudgetListPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConfirmationService,
        MessageService,
      ],
    });
    fixture = TestBed.createComponent(BudgetListPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(BudgetsStoreService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    confirmationService = TestBed.inject(ConfirmationService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should render empty state, budget cards, dialog and navigate on create', async () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/v1/budgets').flush([]);
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum orçamento mensal criado');

    const mockItem = {
      id: 'b-1',
      competenceMonth: '2026-11',
      transactionCount: 2,
      summary: {
        plannedIncome: 1000,
        realizedIncome: 1000,
        plannedExpense: 500,
        realizedExpense: 250,
        plannedBalance: 500,
        realizedBalance: 750,
      },
      createdAt: '',
      updatedAt: '',
    };
    store.budgets.set([mockItem]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Novembro 2026');

    component.openCreateDialog();
    fixture.detectChanges();
    component.newCompetenceMonth = 'invalid';
    expect(component.isValidCompetenceMonth()).toBe(false);

    component.newCompetenceMonth = '2026-11';
    expect(component.isValidCompetenceMonth()).toBe(true);

    const createSpy = vi.spyOn(store, 'createBudget').mockResolvedValue({
      id: 'b-1',
      competenceMonth: '2026-11',
      materializedCount: 3,
      summary: mockItem.summary,
      createdAt: '',
      updatedAt: '',
    });
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await component.createBudget();
    expect(createSpy).toHaveBeenCalledWith('2026-11');
    expect(navSpy).toHaveBeenCalledWith(['/budgets', 'b-1']);

    expect(component.expenseProgress(mockItem)).toBe(50);

    component.openBudget('b-1');
    expect(navSpy).toHaveBeenCalledTimes(2);

    const confirmSpy = vi.spyOn(confirmationService, 'confirm');
    component.confirmDelete(new MouseEvent('click'), mockItem);
    expect(confirmSpy).toHaveBeenCalled();

    expect(fixture.nativeElement.innerHTML).not.toContain('emerald-');
    expect(fixture.nativeElement.innerHTML).toContain('2xl:grid-cols-4');
  });
});
