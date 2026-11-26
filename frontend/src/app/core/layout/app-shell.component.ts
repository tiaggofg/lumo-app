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
      <aside class="hidden lg:flex lg:flex-col lg:w-68 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div class="h-18 px-6 flex items-center gap-3.5 border-b border-slate-200 dark:border-slate-800">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
            L
          </div>
          <div>
            <span class="font-extrabold text-xl tracking-tight">Lumo</span>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">Controle Financeiro</p>
          </div>
        </div>

        <nav class="flex-1 p-4 flex flex-col gap-1.5" aria-label="Navegação principal">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
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
            class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
          >
            <span class="flex items-center gap-3">
              <i [class]="themeService.isDark() ? 'pi pi-sun text-amber-400' : 'pi pi-moon text-indigo-500'"></i>
              <span>{{ themeService.isDark() ? 'Modo Claro' : 'Modo Escuro' }}</span>
            </span>
          </button>
        </div>
      </aside>

      <!-- Mobile Top Bar -->
      <header class="lg:hidden sticky top-0 z-30 h-15 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
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
          <a routerLink="/dashboard" class="flex items-center gap-2.5 font-extrabold text-lg">
            <span class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-extrabold">L</span>
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
          <nav class="relative z-50 w-68 max-w-[82vw] bg-white dark:bg-slate-900 h-full p-4 flex flex-col gap-1.5 shadow-xl">
            <div class="flex items-center justify-between pb-4 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span class="font-extrabold text-xl">Lumo</span>
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
                routerLinkActive="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                (click)="mobileMenuOpen.set(false)"
                class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              >
                <i [class]="item.icon + ' text-base'"></i>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>
      }

      <!-- Main Content -->
      <main class="flex-1 min-w-0 w-full p-5 sm:p-6 lg:px-10 lg:py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppShellComponent {
  readonly themeService = inject(ThemeService);
  readonly mobileMenuOpen = signal(false);

  readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-chart-pie' },
    { label: 'Orçamentos', route: '/budgets', icon: 'pi pi-wallet' },
    { label: 'Recorrências', route: '/recurrences', icon: 'pi pi-sync' },
    { label: 'Cadastros', route: '/catalog', icon: 'pi pi-tags' },
  ];
}
