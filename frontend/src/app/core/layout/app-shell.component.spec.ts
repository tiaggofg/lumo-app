import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthUser } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { AppShellComponent, SIDEBAR_COLLAPSED_STORAGE_KEY } from './app-shell.component';

describe('AppShellComponent', () => {
  let userSignal: ReturnType<typeof signal<AuthUser | null>>;
  let logoutSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    localStorage.removeItem('lumo-theme');
    document.documentElement.classList.remove('dark');

    userSignal = signal<AuthUser | null>({
      id: 'u-1',
      email: 'dev@lumo.local',
      name: 'Desenvolvedor Lumo',
      avatarUrl: null,
    });
    logoutSpy = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: userSignal,
            logout: logoutSpy,
          },
        },
      ],
    });
  });

  afterEach(() => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    localStorage.removeItem('lumo-theme');
    document.documentElement.classList.remove('dark');
  });

  it('should render navigation links, Lumo SVG logo, and compact desktop footer without inline name, email or logout', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const navRoutes = fixture.componentInstance.navItems.map((i) => i.route);
    expect(navRoutes).toEqual(['/dashboard', '/budgets', '/recurrences', '/catalog']);

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Orçamentos');
    expect(fixture.nativeElement.textContent).toContain('Recorrências');
    expect(fixture.nativeElement.textContent).toContain('Cadastros');
    expect(fixture.nativeElement.querySelector('app-lumo-logo')).toBeTruthy();

    const footer: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="sidebar-footer-desktop"]'
    );
    expect(footer).toBeTruthy();
    expect(footer.textContent).not.toContain('Desenvolvedor Lumo');
    expect(footer.textContent).not.toContain('dev@lumo.local');
    expect(footer.textContent).not.toContain('Sair');

    const controlsRow: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="sidebar-footer-controls-desktop"]'
    );
    expect(controlsRow.className).toContain('justify-between');
    expect(controlsRow.querySelector('[data-testid="user-profile-desktop"]')).toBeTruthy();
    expect(controlsRow.querySelector('[data-testid="theme-toggle-desktop"]')).toBeTruthy();
  });

  it('should render Dark Sidebar (bg-slate-900), bg-slate-100 canvas, fluid full-width main and fixed h-dvh sticky top-0 sidebar', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const asideEl: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="desktop-sidebar"]'
    );
    expect(asideEl).toBeTruthy();
    expect(asideEl.className).toContain('h-dvh');
    expect(asideEl.className).toContain('sticky');
    expect(asideEl.className).toContain('top-0');
    expect(asideEl.className).toContain('bg-slate-900');
    expect(asideEl.className).toContain('lg:w-68');
    expect(asideEl.className).toContain('overflow-visible');

    const mainEl: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(mainEl).toBeTruthy();
    expect(mainEl.className).toContain('w-full');
    expect(mainEl.className).not.toContain('max-w-7xl');

    const html: string = fixture.nativeElement.innerHTML;
    expect(html).toContain('bg-slate-100');
    expect(html).toContain('indigo-600');
    expect(html).not.toContain('emerald-');
  });

  it('should stack profile avatar and theme toggle vertically when sidebar is collapsed', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const asideEl: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="desktop-sidebar"]'
    );
    expect(component.sidebarCollapsed()).toBe(false);
    expect(asideEl.className).toContain('lg:w-68');

    const toggleBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="sidebar-collapse-toggle"]'
    );
    toggleBtn.click();
    fixture.detectChanges();

    expect(component.sidebarCollapsed()).toBe(true);
    expect(asideEl.className).toContain('lg:w-20');
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('true');

    const logoEl = asideEl.querySelector('[data-testid="lumo-logo"]');
    expect(logoEl?.getAttribute('data-variant')).toBe('mark');

    const navLinks = asideEl.querySelectorAll('nav a');
    expect(navLinks[0].getAttribute('data-tooltip')).toBe('Dashboard');

    const controlsRow = asideEl.querySelector('[data-testid="sidebar-footer-controls-desktop"]');
    expect(controlsRow?.className).toContain('flex-col');
    expect(controlsRow?.className).toContain('items-center');

    const avatarBtn = asideEl.querySelector('[data-testid="user-profile-desktop"]');
    expect(avatarBtn?.getAttribute('data-tooltip')).toBe('Desenvolvedor Lumo');

    const themeBtn = asideEl.querySelector('[data-testid="theme-toggle-desktop"]');
    expect(themeBtn?.getAttribute('data-tooltip')).toBe('Modo Escuro');

    const secondFixture = TestBed.createComponent(AppShellComponent);
    secondFixture.detectChanges();
    expect(secondFixture.componentInstance.sidebarCollapsed()).toBe(true);
  });

  it('should render footer in mobile drawer and omit theme toggle from mobile header', () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, 'true');
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();

    const headerEl: HTMLElement = fixture.nativeElement.querySelector('header');
    expect(headerEl.querySelector('[data-testid="theme-toggle-mobile"]')).toBeNull();

    const drawer: HTMLElement | null = fixture.nativeElement.querySelector(
      '[data-testid="mobile-drawer"]'
    );
    expect(drawer).toBeTruthy();
    expect(drawer?.textContent).toContain('Dashboard');
    const drawerLogo = drawer?.querySelector('[data-testid="lumo-logo"]');
    expect(drawerLogo?.getAttribute('data-variant')).toBe('full');

    const mobileFooter = drawer?.querySelector('[data-testid="sidebar-footer-mobile"]');
    expect(mobileFooter?.className).toContain('justify-between');
    expect(mobileFooter?.querySelector('[data-testid="user-profile-mobile"]')).toBeTruthy();
    expect(mobileFooter?.querySelector('[data-testid="theme-toggle-mobile"]')).toBeTruthy();

    // Open mobile popover and trigger logout
    const mobileAvatarBtn = mobileFooter?.querySelector(
      '[data-testid="user-profile-mobile"]'
    ) as HTMLButtonElement;
    mobileAvatarBtn.click();
    fixture.detectChanges();

    const logoutBtn = drawer?.querySelector(
      '[data-testid="profile-popover-logout"]'
    ) as HTMLButtonElement;
    expect(logoutBtn).toBeTruthy();
    logoutBtn.click();
    fixture.detectChanges();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
    expect(fixture.componentInstance.profileMenuOpen()).toBeNull();
  });

  it('should toggle dark mode from desktop and mobile drawer footer', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();

    const desktopThemeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="theme-toggle-desktop"]'
    );
    expect(desktopThemeBtn.getAttribute('aria-label')).toBe('Ativar modo escuro');
    expect(desktopThemeBtn.querySelector('.pi-moon')).toBeTruthy();

    desktopThemeBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.themeService.isDark()).toBe(true);
    expect(desktopThemeBtn.getAttribute('aria-label')).toBe('Ativar modo claro');
    expect(desktopThemeBtn.querySelector('.pi-sun')).toBeTruthy();

    const mobileThemeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="theme-toggle-mobile"]'
    );
    expect(mobileThemeBtn.getAttribute('aria-label')).toBe('Ativar modo claro');
    mobileThemeBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.themeService.isDark()).toBe(false);
    expect(mobileThemeBtn.getAttribute('aria-label')).toBe('Ativar modo escuro');
    expect(mobileThemeBtn.querySelector('.pi-moon')).toBeTruthy();
  });

  it('should set aria-expanded and render popover above main content', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const avatarBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-desktop"]'
    );
    expect(avatarBtn.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[data-testid="user-profile-popover"]')).toBeNull();

    avatarBtn.click();
    fixture.detectChanges();

    expect(avatarBtn.getAttribute('aria-expanded')).toBe('true');
    const popover: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-popover"]'
    );
    expect(popover).toBeTruthy();
    expect(popover.className).toContain('z-50');
    expect(popover.textContent).toContain('Desenvolvedor Lumo');
    expect(popover.textContent).toContain('dev@lumo.local');
    expect(popover.textContent).toContain('Sair');

    const asideEl: HTMLElement = fixture.nativeElement.querySelector(
      '[data-testid="desktop-sidebar"]'
    );
    expect(asideEl.className).toContain('z-30');
    expect(asideEl.className).toContain('overflow-visible');
  });

  it('should close popover on outside click, second toggle click, or Escape key', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const avatarBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-desktop"]'
    );

    // Open and close by clicking avatar again
    avatarBtn.click();
    fixture.detectChanges();
    expect(avatarBtn.getAttribute('aria-expanded')).toBe('true');

    avatarBtn.click();
    fixture.detectChanges();
    expect(avatarBtn.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[data-testid="user-profile-popover"]')).toBeNull();

    // Open and close with Escape
    avatarBtn.click();
    fixture.detectChanges();
    expect(avatarBtn.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(avatarBtn.getAttribute('aria-expanded')).toBe('false');

    // Open and close by clicking outside
    avatarBtn.click();
    fixture.detectChanges();
    expect(avatarBtn.getAttribute('aria-expanded')).toBe('true');

    const mainEl: HTMLElement = fixture.nativeElement.querySelector('main');
    mainEl.click();
    fixture.detectChanges();
    expect(avatarBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should render user initials fallback when avatarUrl is null', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const fallback = fixture.nativeElement.querySelector(
      '[data-testid="user-avatar-fallback-desktop"]'
    );
    expect(fallback?.textContent?.trim()).toBe('DL');
    expect(fixture.componentInstance.userInitials()).toBe('DL');

    userSignal.set({
      id: 'u-2',
      email: 'tiago@lumo.local',
      name: 'Tiago Godoy',
      avatarUrl: 'https://example.com/photo.jpg',
    });
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-desktop"] img'
    ) as HTMLImageElement | null;
    expect(img).toBeTruthy();
    expect(img?.src).toContain('https://example.com/photo.jpg');
  });

  it('should close profile popover when toggling sidebar collapse or closing mobile drawer', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const avatarBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-desktop"]'
    );
    avatarBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.profileMenuOpen()).toBe('desktop');

    fixture.componentInstance.toggleSidebar();
    fixture.detectChanges();
    expect(fixture.componentInstance.profileMenuOpen()).toBeNull();

    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();
    const mobileAvatarBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-mobile"]'
    );
    mobileAvatarBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.profileMenuOpen()).toBe('mobile');

    fixture.componentInstance.closeMobileMenu();
    fixture.detectChanges();
    expect(fixture.componentInstance.profileMenuOpen()).toBeNull();
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
  });

  it('should keep profile popover readable when theme changes while open', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const avatarBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-desktop"]'
    );
    avatarBtn.click();
    fixture.detectChanges();

    const themeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="theme-toggle-desktop"]'
    );
    themeBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.themeService.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const popover: HTMLElement | null = fixture.nativeElement.querySelector(
      '[data-testid="user-profile-popover"]'
    );
    expect(popover).toBeTruthy();
    expect(popover?.className).toContain('bg-white');
    expect(popover?.className).toContain('dark:bg-slate-950');
    expect(popover?.className).toContain('text-slate-900');
    expect(popover?.className).toContain('dark:text-slate-100');
  });

  it('should fall back gracefully when localStorage throws an error', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.sidebarCollapsed()).toBe(false);

    fixture.componentInstance.toggleSidebar();
    expect(fixture.componentInstance.sidebarCollapsed()).toBe(true);

    getSpy.mockRestore();
    setSpy.mockRestore();
  });
});
