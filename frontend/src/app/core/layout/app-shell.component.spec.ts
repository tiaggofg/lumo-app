import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppShellComponent, SIDEBAR_COLLAPSED_STORAGE_KEY } from './app-shell.component';

describe('AppShellComponent', () => {
  beforeEach(() => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])],
    });
  });

  afterEach(() => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
  });

  it('should render navigation links, Lumo SVG logo and toggle mobile menu', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const navRoutes = fixture.componentInstance.navItems.map((i) => i.route);
    expect(navRoutes).toEqual(['/dashboard', '/budgets', '/recurrences', '/catalog']);

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Orçamentos');
    expect(fixture.nativeElement.textContent).toContain('Recorrências');
    expect(fixture.nativeElement.textContent).toContain('Cadastros');

    expect(fixture.nativeElement.querySelector('app-lumo-logo')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('z-toast-viewport')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('z-confirm-dialog')).toBeTruthy();

    expect(fixture.componentInstance.mobileMenuOpen()).toBe(false);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.mobileMenuOpen()).toBe(true);
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
    expect(toggleBtn).toBeTruthy();
    toggleBtn.click();
    fixture.detectChanges();

    expect(component.sidebarCollapsed()).toBe(true);
    expect(asideEl.className).toContain('lg:w-20');
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('true');

    // In collapsed mode, logo switches to mark variant and nav links expose data-tooltip
    const logoEl = asideEl.querySelector('[data-testid="lumo-logo"]');
    expect(logoEl?.getAttribute('data-variant')).toBe('mark');

    const navLinks = asideEl.querySelectorAll('nav a');
    expect(navLinks[0].getAttribute('data-tooltip')).toBe('Dashboard');

    // Re-instantiate component and verify state restored from localStorage
    const secondFixture = TestBed.createComponent(AppShellComponent);
    secondFixture.detectChanges();
    expect(secondFixture.componentInstance.sidebarCollapsed()).toBe(true);
  });

  it('should render full Lumo logo and navigation labels in mobile drawer even when desktop sidebar is collapsed', () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, 'true');
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentInstance.mobileMenuOpen.set(true);
    fixture.detectChanges();

    const drawer: HTMLElement | null = fixture.nativeElement.querySelector(
      '[data-testid="mobile-drawer"]'
    );
    expect(drawer).toBeTruthy();
    expect(drawer?.textContent).toContain('Dashboard');
    expect(drawer?.textContent).toContain('Orçamentos');
    const drawerLogo = drawer?.querySelector('[data-testid="lumo-logo"]');
    expect(drawerLogo?.getAttribute('data-variant')).toBe('full');
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
