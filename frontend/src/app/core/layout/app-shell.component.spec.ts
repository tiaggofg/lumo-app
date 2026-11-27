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
  });

  it('should render navigation links, Lumo SVG logo, user profile and logout buttons', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const navRoutes = fixture.componentInstance.navItems.map((i) => i.route);
    expect(navRoutes).toEqual(['/dashboard', '/budgets', '/recurrences', '/catalog']);

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Orçamentos');
    expect(fixture.nativeElement.textContent).toContain('Recorrências');
    expect(fixture.nativeElement.textContent).toContain('Cadastros');
    expect(fixture.nativeElement.textContent).toContain('Desenvolvedor Lumo');
    expect(fixture.nativeElement.textContent).toContain('dev@lumo.local');
    expect(fixture.componentInstance.userInitials()).toBe('DL');

    expect(fixture.nativeElement.querySelector('app-lumo-logo')).toBeTruthy();

    const logoutBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="logout-button-desktop"]'
    );
    expect(logoutBtn).toBeTruthy();
    logoutBtn.click();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('should render Dark Sidebar (bg-slate-900), bg-slate-100 canvas, fluid full-width main and fixed h-dvh sticky top-0 sidebar', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const asideEl: HTMLElement = fixture.nativeElement.querySelector('[data-testid="desktop-sidebar"]');
    expect(asideEl).toBeTruthy();
    expect(asideEl.className).toContain('h-dvh');
    expect(asideEl.className).toContain('sticky');
    expect(asideEl.className).toContain('top-0');
    expect(asideEl.className).toContain('bg-slate-900');
    expect(asideEl.className).toContain('lg:w-68');

    const mainEl: HTMLElement = fixture.nativeElement.querySelector('main');
    expect(mainEl).toBeTruthy();
    expect(mainEl.className).toContain('w-full');
    expect(mainEl.className).not.toContain('max-w-7xl');

    const html: string = fixture.nativeElement.innerHTML;
    expect(html).toContain('bg-slate-100');
    expect(html).toContain('indigo-600');
    expect(html).not.toContain('emerald-');
  });

  it('should toggle desktop sidebar between expanded (lg:w-68) and collapsed icon rail (lg:w-20) and persist in localStorage', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const asideEl: HTMLElement = fixture.nativeElement.querySelector('[data-testid="desktop-sidebar"]');
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

    const logoutBtn = asideEl.querySelector('[data-testid="logout-button-desktop"]');
    expect(logoutBtn?.getAttribute('data-tooltip')).toBe('Sair');

    const secondFixture = TestBed.createComponent(AppShellComponent);
    secondFixture.detectChanges();
    expect(secondFixture.componentInstance.sidebarCollapsed()).toBe(true);
  });

  it('should render full Lumo logo, user profile and logout button in mobile drawer', () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, 'true');
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();

    const drawer: HTMLElement | null = fixture.nativeElement.querySelector(
      '[data-testid="mobile-drawer"]'
    );
    expect(drawer).toBeTruthy();
    expect(drawer?.textContent).toContain('Dashboard');
    expect(drawer?.textContent).toContain('Desenvolvedor Lumo');
    const drawerLogo = drawer?.querySelector('[data-testid="lumo-logo"]');
    expect(drawerLogo?.getAttribute('data-variant')).toBe('full');

    const mobileLogout: HTMLButtonElement | null = drawer?.querySelector(
      '[data-testid="logout-button-mobile"]'
    ) ?? null;
    expect(mobileLogout).toBeTruthy();
    mobileLogout?.click();
    expect(logoutSpy).toHaveBeenCalled();
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

  it('should toggle theme via desktop theme toggle button', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    const initialDark = fixture.componentInstance.themeService.isDark();

    const themeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="theme-toggle-desktop"]'
    );
    themeBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.themeService.isDark()).toBe(!initialDark);
  });
});
