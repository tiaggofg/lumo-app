import { Injectable, signal } from '@angular/core';

export type ZToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ZToastItem {
  id: string;
  severity: ZToastSeverity;
  summary: string;
  detail?: string;
  life: number;
}

export interface ZToastInput {
  severity?: ZToastSeverity;
  summary: string;
  detail?: string;
  life?: number;
}

@Injectable({ providedIn: 'root' })
export class ZToastService {
  private static nextId = 0;

  readonly toasts = signal<ZToastItem[]>([]);

  add(input: ZToastInput): string {
    const id = `z-toast-${++ZToastService.nextId}-${Date.now()}`;
    const item: ZToastItem = {
      id,
      severity: input.severity ?? 'info',
      summary: input.summary,
      detail: input.detail,
      life: input.life ?? 5000,
    };

    this.toasts.update((list) => [...list, item]);

    if (item.life > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, item.life);
    }

    return id;
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
