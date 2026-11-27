import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LumoLogoComponent,
  ZConfirmDialogComponent,
  ZToastViewportComponent,
  ZTooltipDirective,
} from '../../shared/ui';
import { ThemeService } from '../services/theme.service';

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'lumo-sidebar-collapsed';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LumoLogoComponent,
    ZToastViewportComponent,
    ZConfirmDialogComponent,
    ZTooltipDirective,
  ],
  template: `
    <z-toast-viewport />
    <z-confirm-dialog />

    <div class="min-h-screen flex flex-col lg:flex-row bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <!-- Desktop Sidebar (Fixed 100dvh, Dark Surface in Light & Dark Mode, Collapsible Rail) -->
      <aside
        data-testid="desktop-sidebar"
        [attr.data-collapsed]="sidebarCollapsed()"
        [class]="
          'hidden lg:flex lg:flex-col h-dvh sticky top-0 overflow-y-auto shrink-0 select-none bg-slate-900 text-slate-100 border-r border-slate-800 transition-[width] duration-200 ease-in-out ' +
          (sidebarCollapsed() ? 'lg:w-20' : 'lg:w-68')
        "
      >
        <!-- Brand Header & Collapse Toggle -->
        <div
          class="h-18 shrink-0 flex items-center border-b border-slate-800/90"
          [class]="sidebarCollapsed() ? 'px-2 justify-center' : 'px-5 justify-between'"
        >
          <a
            routerLink="/dashboard"
            class="flex items-center focus:outline-none rounded-xl"
            aria-label="Lumo Dashboard"
          >
            <app-lumo-logo
              [variant]="sidebarCollapsed() ? 'mark' : 'full'"
              subtitle="Controle Financeiro"
              tone="dark-surface"
            />
          </a>

          @if (!sidebarCollapsed()) {
            <button
              type="button"
              data-testid="sidebar-collapse-toggle"
              (click)="toggleSidebar()"
              zTooltip="Minimizar menu lateral"
              tooltipPosition="right"
              aria-label="Minimizar menu lateral"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/90 transition-colors cursor-pointer"
            >
              <i class="pi pi-angle-double-left text-sm" aria-hidden="true"></i>
            </button>
          }
        </div>

        <!-- Navigation Links -->
        <nav
          class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5"
          aria-label="Navegação principal"
        >
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-950/50"
              [zTooltip]="sidebarCollapsed() ? item.label : ''"
              tooltipPosition="right"
              [attr.aria-label]="item.label"
              [class]="
                'flex items-center rounded-xl text-[15px] text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors ' +
                (sidebarCollapsed() ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-3')
              "
            >
              <i [class]="item.icon + ' text-base shrink-0'" aria-hidden="true"></i>
              @if (!sidebarCollapsed()) {
                <span class="truncate">{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <!-- Sidebar Footer: Expand Button (when collapsed) + Theme Toggle -->
        <div class="p-3 border-t border-slate-800/90 shrink-0 space-y-1.5">
          @if (sidebarCollapsed()) {
            <button
              type="button"
              data-testid="sidebar-collapse-toggle"
              (click)="toggleSidebar()"
              zTooltip="Expandir menu lateral"
              tooltipPosition="right"
              aria-label="Expandir menu lateral"
              class="w-full flex items-center justify-center py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <i class="pi pi-angle-double-right text-sm" aria-hidden="true"></i>
            </button>
          }

          <button
            type="button"
            data-testid="theme-toggle-desktop"
            (click)="themeService.toggle()"
            [zTooltip]="
              sidebarCollapsed()
                ? (themeService.isDark() ? 'Modo Claro' : 'Modo Escuro')
                : ''
            "
            tooltipPosition="right"
            [class]="
              'w-full flex items-center rounded-xl text-[15px] text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors cursor-pointer ' +
              (sidebarCollapsed() ? 'justify-center py-3 px-0' : 'justify-between px-3.5 py-3')
            "
            [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
          >
            <span class="flex items-center gap-3">
              <i
                [class]="themeService.isDark() ? 'pi pi-sun text-amber-400' : 'pi pi-moon text-sky-400'"
                aria-hidden="true"
              ></i>
              @if (!sidebarCollapsed()) {
                <span>{{ themeService.isDark() ? 'Modo Claro' : 'Modo Escuro' }}</span>
              }
            </span>
          </button>
        </div>
      </aside>

      <!-- Mobile Top Bar -->
      <header class="lg:hidden sticky top-0 z-30 h-15 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 text-slate-100 shadow-xs">
        <div class="flex items-center gap-3">
          <button
            type="button"
            data-testid="mobile-menu-toggle"
            (click)="mobileMenuOpen.set(!mobileMenuOpen())"
            class="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Abrir menu"
          >
            <i class="pi pi-bars text-lg" aria-hidden="true"></i>
          </button>
          <a routerLink="/dashboard" class="flex items-center">
            <app-lumo-logo variant="full" size="sm" tone="dark-surface" />
          </a>
        </div>

        <button
          type="button"
          data-testid="theme-toggle-mobile"
          (click)="themeService.toggle()"
          class="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
        >
          <i [class]="themeService.isDark() ? 'pi pi-sun text-amber-400 text-lg' : 'pi pi-moon text-sky-400 text-lg'" aria-hidden="true"></i>
        </button>
      </header>

      <!-- Mobile Slide-out Drawer -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden fixed inset-0 z-40 flex">
          <div
            class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            (click)="mobileMenuOpen.set(false)"
            aria-hidden="true"
          ></div>
          <nav
            data-testid="mobile-drawer"
            class="relative z-50 w-68 max-w-[82vw] bg-slate-900 text-slate-100 border-r border-slate-800 h-full p-4 flex flex-col gap-1.5 shadow-2xl"
          >
            <div class="flex items-center justify-between pb-4 mb-2 border-b border-slate-800">
              <app-lumo-logo variant="full" size="sm" subtitle="Controle Financeiro" tone="dark-surface" />
              <button
                type="button"
                (click)="mobileMenuOpen.set(false)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Fechar menu"
              >
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            </div>
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-indigo-600 text-white font-semibold"
                (click)="mobileMenuOpen.set(false)"
                class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
              >
                <i [class]="item.icon + ' text-base'" aria-hidden="true"></i>
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
  readonly sidebarCollapsed = signal(this.readInitialCollapsedState());

  readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-chart-pie' },
    { label: 'Orçamentos', route: '/budgets', icon: 'pi pi-wallet' },
    { label: 'Recorrências', route: '/recurrences', icon: 'pi pi-sync' },
    { label: 'Cadastros', route: '/catalog', icon: 'pi pi-tags' },
  ];

  toggleSidebar(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
    } catch {
      // Safe fallback when localStorage is unavailable
    }
  }

  private readInitialCollapsedState(): boolean {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
