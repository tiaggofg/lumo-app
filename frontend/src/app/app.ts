import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZConfirmDialogComponent, ZToastViewportComponent } from './shared/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ZToastViewportComponent, ZConfirmDialogComponent],
  template: `
    <z-toast-viewport />
    <z-confirm-dialog />
    <router-outlet />
  `,
})
export class App {}
