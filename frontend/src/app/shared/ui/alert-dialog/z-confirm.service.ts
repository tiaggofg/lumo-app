import { Injectable, signal } from '@angular/core';

export interface ZConfirmOptions {
  header: string;
  message: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  variant?: 'destructive' | 'default';
  accept: () => void;
  reject?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ZConfirmService {
  readonly activeConfirmation = signal<ZConfirmOptions | null>(null);

  confirm(options: ZConfirmOptions): void {
    this.activeConfirmation.set({
      variant: 'destructive',
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      ...options,
    });
  }

  accept(): void {
    const current = this.activeConfirmation();
    this.activeConfirmation.set(null);
    current?.accept();
  }

  reject(): void {
    const current = this.activeConfirmation();
    this.activeConfirmation.set(null);
    current?.reject?.();
  }
}
