import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LumoLogoComponent, ZTooltipDirective } from '../../shared/ui';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../services/theme.service';
import { UserProfilePopoverComponent } from './user-profile-popover.component';

export const SIDEBAR_COLLAPSED_STORAGE_KEY = 'lumo-sidebar-collapsed';

type ActiveProfilePopover = 'desktop' | 'mobile' | null;

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LumoLogoComponent,
    ZTooltipDirective,
    UserProfilePopoverComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col lg:flex-row bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <!-- Desktop Sidebar (Fixed 100dvh, Dark Surface in Light & Dark Mode, Collapsible Rail) -->
      <aside
        data-testid="desktop-sidebar"
        [attr.data-collapsed]="sidebarCollapsed()"
        [class]="
          'hidden lg:flex lg:flex-col h-dvh sticky top-0 z-30 overflow-visible shrink-0 select-none bg-slate-900 text-slate-100 border-r border-slate-800 transition-[width] duration-200 ease-in-out ' +
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

        <!-- Sidebar Footer: Expand Button (when collapsed) + Compact Avatar & Theme Row -->
        <div
          data-testid="sidebar-footer-desktop"
          class="p-3.5 border-t border-slate-800/90 shrink-0 space-y-2.5"
        >
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

          <div
            data-testid="sidebar-footer-controls-desktop"
            [class]="
              sidebarCollapsed()
                ? 'flex flex-col items-center gap-2.5'
                : 'flex items-center justify-between gap-2'
            "
          >
            @if (authService.user(); as currentUser) {
              <div class="relative">
                <button
                  type="button"
                  data-testid="user-profile-desktop"
                  data-profile-popover-trigger
                  (click)="toggleProfileMenu('desktop')"
                  [zTooltip]="
                    sidebarCollapsed() && profileMenuOpen() !== 'desktop' ? currentUser.name : ''
                  "
                  tooltipPosition="right"
                  aria-haspopup="dialog"
                  [attr.aria-expanded]="profileMenuOpen() === 'desktop'"
                  [attr.aria-label]="'Menu da conta de ' + currentUser.name"
                  class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-1 ring-slate-700/80 hover:ring-indigo-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-all cursor-pointer shrink-0"
                >
                  @if (currentUser.avatarUrl) {
                    <img
                      [src]="currentUser.avatarUrl"
                      [alt]="currentUser.name"
                      referrerpolicy="no-referrer"
                      class="w-full h-full object-cover"
                    />
                  } @else {
                    <span
                      data-testid="user-avatar-fallback-desktop"
                      class="w-full h-full bg-indigo-600/90 text-white text-xs font-bold flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {{ userInitials() }}
                    </span>
                  }
                </button>

                @if (profileMenuOpen() === 'desktop') {
                  <app-user-profile-popover
                    [user]="currentUser"
                    [position]="sidebarCollapsed() ? 'right' : 'above'"
                    (closed)="closeProfileMenu()"
                    (logout)="onLogout()"
                  />
                }
              </div>
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
              [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
              class="w-10 h-10 rounded-xl border border-slate-700/80 bg-slate-950/70 hover:bg-slate-800/90 hover:border-slate-600 text-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <i
                [class]="
                  themeService.isDark()
                    ? 'pi pi-sun text-amber-400 text-base'
                    : 'pi pi-moon text-slate-100 text-base'
                "
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- Mobile Top Bar -->
      <header class="lg:hidden sticky top-0 z-30 h-15 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 text-slate-100 shadow-xs">
        <div class="flex items-center gap-3">
          <button
            type="button"
            data-testid="mobile-menu-toggle"
            (click)="toggleMobileMenu()"
            class="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Abrir menu"
          >
            <i class="pi pi-bars text-lg" aria-hidden="true"></i>
          </button>
          <a routerLink="/dashboard" class="flex items-center">
            <app-lumo-logo variant="full" size="sm" tone="dark-surface" />
          </a>
        </div>
      </header>

      <!-- Mobile Slide-out Drawer -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden fixed inset-0 z-40 flex">
          <div
            class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            (click)="closeMobileMenu()"
            aria-hidden="true"
          ></div>
          <nav
            data-testid="mobile-drawer"
            class="relative z-50 w-68 max-w-[82vw] bg-slate-900 text-slate-100 border-r border-slate-800 h-full p-4 flex flex-col gap-1.5 shadow-2xl overflow-visible"
          >
            <div class="flex items-center justify-between pb-4 mb-2 border-b border-slate-800">
              <app-lumo-logo variant="full" size="sm" subtitle="Controle Financeiro" tone="dark-surface" />
              <button
                type="button"
                (click)="closeMobileMenu()"
                class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Fechar menu"
              >
                <i class="pi pi-times" aria-hidden="true"></i>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto flex flex-col gap-1.5">
              @for (item of navItems; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-indigo-600 text-white font-semibold"
                  (click)="closeMobileMenu()"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <i [class]="item.icon + ' text-base'" aria-hidden="true"></i>
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>

            <div
              data-testid="sidebar-footer-mobile"
              class="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between gap-2"
            >
              @if (authService.user(); as currentUser) {
                <div class="relative">
                  <button
                    type="button"
                    data-testid="user-profile-mobile"
                    data-profile-popover-trigger
                    (click)="toggleProfileMenu('mobile')"
                    aria-haspopup="dialog"
                    [attr.aria-expanded]="profileMenuOpen() === 'mobile'"
                    [attr.aria-label]="'Menu da conta de ' + currentUser.name"
                    class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-1 ring-slate-700/80 hover:ring-indigo-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-all cursor-pointer shrink-0"
                  >
                    @if (currentUser.avatarUrl) {
                      <img
                        [src]="currentUser.avatarUrl"
                        [alt]="currentUser.name"
                        referrerpolicy="no-referrer"
                        class="w-full h-full object-cover"
                      />
                    } @else {
                      <span
                        data-testid="user-avatar-fallback-mobile"
                        class="w-full h-full bg-indigo-600/90 text-white text-xs font-bold flex items-center justify-center"
                        aria-hidden="true"
                      >
                        {{ userInitials() }}
                      </span>
                    }
                  </button>

                  @if (profileMenuOpen() === 'mobile') {
                    <app-user-profile-popover
                      [user]="currentUser"
                      position="above"
                      (closed)="closeProfileMenu()"
                      (logout)="onLogout()"
                    />
                  }
                </div>
              }

              <button
                type="button"
                data-testid="theme-toggle-mobile"
                (click)="themeService.toggle()"
                [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
                class="w-10 h-10 rounded-xl border border-slate-700/80 bg-slate-950/70 hover:bg-slate-800/90 hover:border-slate-600 text-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <i
                  [class]="
                    themeService.isDark()
                      ? 'pi pi-sun text-amber-400 text-base'
                      : 'pi pi-moon text-slate-100 text-base'
                  "
                  aria-hidden="true"
                ></i>
              </button>
            </div>
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
  readonly authService = inject(AuthService);
  readonly mobileMenuOpen = signal(false);
  readonly sidebarCollapsed = signal(this.readInitialCollapsedState());
  readonly profileMenuOpen = signal<ActiveProfilePopover>(null);

  readonly userInitials = computed(() => {
    const user = this.authService.user();
    if (!user) {
      return '?';
    }
    const source = (user.name || user.email || '').trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  });

  readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-chart-pie' },
    { label: 'Orçamentos', route: '/budgets', icon: 'pi pi-wallet' },
    { label: 'Recorrências', route: '/recurrences', icon: 'pi pi-sync' },
    { label: 'Cadastros', route: '/catalog', icon: 'pi pi-tags' },
  ];

  toggleSidebar(): void {
    this.closeProfileMenu();
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
    } catch {
      // Safe fallback when localStorage is unavailable
    }
  }

  toggleMobileMenu(): void {
    const next = !this.mobileMenuOpen();
    if (!next) {
      this.closeProfileMenu();
    }
    this.mobileMenuOpen.set(next);
  }

  closeMobileMenu(): void {
    this.closeProfileMenu();
    this.mobileMenuOpen.set(false);
  }

  toggleProfileMenu(target: 'desktop' | 'mobile'): void {
    this.profileMenuOpen.update((current) => (current === target ? null : target));
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(null);
  }

  async onLogout(): Promise<void> {
    this.closeProfileMenu();
    this.mobileMenuOpen.set(false);
    await this.authService.logout();
  }

  private readInitialCollapsedState(): boolean {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
