import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'budgets',
    pathMatch: 'full',
  },
  {
    path: 'budgets',
    loadComponent: () =>
      import('./features/budgets/budget-list-page.component').then((m) => m.BudgetListPageComponent),
  },
  {
    path: 'budgets/:id',
    loadComponent: () =>
      import('./features/budgets/budget-detail-page.component').then((m) => m.BudgetDetailPageComponent),
  },
  {
    path: 'recurrences',
    loadComponent: () =>
      import('./features/recurrences/recurrences-page.component').then((m) => m.RecurrencesPageComponent),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./features/catalog/catalog-page.component').then((m) => m.CatalogPageComponent),
  },
  {
    path: '**',
    redirectTo: 'budgets',
  },
];
