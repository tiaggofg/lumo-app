import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should default to light mode when localStorage is empty', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle dark mode and persist to localStorage', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    service.toggle();
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('lumo-theme')).toBe('dark');

    service.toggle();
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('lumo-theme')).toBe('light');
  });

  it('should restore dark preference from localStorage on bootstrap', () => {
    localStorage.setItem('lumo-theme', 'dark');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
