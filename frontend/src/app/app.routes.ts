import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './core/layout/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          ),
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budget-list-page.component').then(
            (m) => m.BudgetListPageComponent
          ),
      },
      {
        path: 'budgets/:id',
        loadComponent: () =>
          import('./features/budgets/budget-detail-page.component').then(
            (m) => m.BudgetDetailPageComponent
          ),
      },
      {
        path: 'recurrences',
        loadComponent: () =>
          import('./features/recurrences/recurrences-page.component').then(
            (m) => m.RecurrencesPageComponent
          ),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/catalog/catalog-page.component').then((m) => m.CatalogPageComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
