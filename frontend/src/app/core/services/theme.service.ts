import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const STORAGE_KEY = 'lumo-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.restorePreference();
  }

  toggle(): void {
    this.setDark(!this.isDark());
  }

  setDark(dark: boolean): void {
    this.isDark.set(dark);
    const root = this.document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  private restorePreference(): void {
    let saved: string | null;
    try {
      saved = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      saved = null;
    }
    this.setDark(saved === 'dark');
  }
}
