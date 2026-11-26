import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastModule, ConfirmDialogModule, ButtonModule],
  template: `
    <p-toast position="top-right" />
    <p-confirmdialog />

    <div class="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div class="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            L
          </div>
          <div>
            <span class="font-bold text-lg tracking-tight">Lumo</span>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-none">Controle Financeiro</p>
          </div>
        </div>

        <nav class="flex-1 p-4 flex flex-col gap-1" aria-label="Navegação principal">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <i [class]="item.icon + ' text-base'"></i>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            data-testid="theme-toggle-desktop"
            (click)="themeService.toggle()"
            class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
          >
            <span class="flex items-center gap-2.5">
              <i [class]="themeService.isDark() ? 'pi pi-sun text-amber-400' : 'pi pi-moon text-indigo-500'"></i>
              <span>{{ themeService.isDark() ? 'Modo Claro' : 'Modo Escuro' }}</span>
            </span>
          </button>
        </div>
      </aside>

      <!-- Mobile Top Bar -->
      <header class="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div class="flex items-center gap-3">
          <button
            type="button"
            data-testid="mobile-menu-toggle"
            (click)="mobileMenuOpen.set(!mobileMenuOpen())"
            class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Abrir menu"
          >
            <i class="pi pi-bars text-lg"></i>
          </button>
          <a routerLink="/budgets" class="flex items-center gap-2 font-bold text-base">
            <span class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm">L</span>
            <span>Lumo</span>
          </a>
        </div>

        <button
          type="button"
          data-testid="theme-toggle-mobile"
          (click)="themeService.toggle()"
          class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
        >
          <i [class]="themeService.isDark() ? 'pi pi-sun text-amber-400 text-lg' : 'pi pi-moon text-indigo-500 text-lg'"></i>
        </button>
      </header>

      <!-- Mobile Slide-out Drawer -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden fixed inset-0 z-40 flex">
          <div
            class="fixed inset-0 bg-slate-900/50"
            (click)="mobileMenuOpen.set(false)"
            aria-hidden="true"
          ></div>
          <nav class="relative z-50 w-64 max-w-[80vw] bg-white dark:bg-slate-900 h-full p-4 flex flex-col gap-1 shadow-xl">
            <div class="flex items-center justify-between pb-4 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span class="font-bold text-lg">Lumo</span>
              <button
                type="button"
                (click)="mobileMenuOpen.set(false)"
                class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fechar menu"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold"
                (click)="mobileMenuOpen.set(false)"
                class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <i [class]="item.icon + ' text-base'"></i>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>
      }

      <!-- Main Content -->
      <main class="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppShellComponent {
  readonly themeService = inject(ThemeService);
  readonly mobileMenuOpen = signal(false);

  readonly navItems = [
    { label: 'Orçamentos', route: '/budgets', icon: 'pi pi-wallet' },
    { label: 'Recorrências', route: '/recurrences', icon: 'pi pi-sync' },
    { label: 'Cadastros', route: '/catalog', icon: 'pi pi-tags' },
  ];
}
