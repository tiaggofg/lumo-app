import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ZCheckboxComponent } from '../checkbox/z-checkbox.component';
import { ZInputDirective, ZTextareaDirective } from '../input/z-input.directive';
import { ZInputNumberComponent } from './z-input-number.component';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    ZInputDirective,
    ZTextareaDirective,
    ZInputNumberComponent,
    ZCheckboxComponent,
  ],
  template: `
    <input id="text-in" zInput [(ngModel)]="text" />
    <textarea id="area-in" zTextarea [(ngModel)]="notes"></textarea>
    <z-input-number
      inputId="amount-in"
      [(ngModel)]="amount"
      mode="currency"
      currency="BRL"
      locale="pt-BR"
      [min]="0.01"
      [max]="10000"
    />
    <z-checkbox inputId="chk-in" [(ngModel)]="flag" [binary]="true" />
  `,
})
class FormHostComponent {
  text = '';
  notes = '';
  amount: number | null = 180;
  flag = false;
}

describe('ZInputDirective, ZTextareaDirective, ZInputNumberComponent & ZCheckboxComponent', () => {
  it('should bind inputId to inner input and parse BRL comma/decimal values in ZInputNumberComponent', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const amountInput: HTMLInputElement | null = host.querySelector('#amount-in');
    expect(amountInput).toBeTruthy();
    expect(amountInput?.value).toBe('180,00');

    // Simulate user typing '195,64'
    if (amountInput) {
      amountInput.value = '195,64';
      amountInput.dispatchEvent(new Event('input'));
      amountInput.dispatchEvent(new Event('blur'));
    }
    fixture.detectChanges();
    expect(fixture.componentInstance.amount).toBe(195.64);

    // Simulate integer string '800'
    if (amountInput) {
      amountInput.value = '800';
      amountInput.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
    expect(fixture.componentInstance.amount).toBe(800);

    // Simulate thousand separator '1.250,50'
    if (amountInput) {
      amountInput.value = '1.250,50';
      amountInput.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
    expect(fixture.componentInstance.amount).toBe(1250.5);

    // Simulate empty input -> null
    if (amountInput) {
      amountInput.value = '';
      amountInput.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
    expect(fixture.componentInstance.amount).toBeNull();
  });

  it('should clamp min and max bounds in ZInputNumberComponent', () => {
    const fixture = TestBed.createComponent(ZInputNumberComponent);
    fixture.componentRef.setInput('min', 1);
    fixture.componentRef.setInput('max', 31);
    fixture.detectChanges();

    const emitted: (number | null)[] = [];
    fixture.componentInstance.registerOnChange((v) => emitted.push(v));

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inputEl.value = '45';
    inputEl.dispatchEvent(new Event('input'));
    expect(emitted.at(-1)).toBe(31);

    inputEl.value = '0';
    inputEl.dispatchEvent(new Event('input'));
    expect(emitted.at(-1)).toBe(1);
  });

  it('should apply ZardUI classes on [zInput] / [zTextarea] and toggle ZCheckboxComponent', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const textInput: HTMLInputElement | null = host.querySelector('#text-in');
    const areaInput: HTMLTextAreaElement | null = host.querySelector('#area-in');
    expect(textInput?.className).toContain('rounded-xl');
    expect(areaInput?.className).toContain('rounded-xl');

    const chkInput: HTMLInputElement | null = host.querySelector('#chk-in');
    expect(chkInput).toBeTruthy();
    expect(chkInput?.checked).toBe(false);

    chkInput?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.flag).toBe(true);
  });

  it('should support disabled state on ZInputNumberComponent and ZCheckboxComponent', () => {
    const numFixture = TestBed.createComponent(ZInputNumberComponent);
    numFixture.componentInstance.setDisabledState(true);
    numFixture.detectChanges();
    expect(numFixture.nativeElement.querySelector('input').disabled).toBe(true);

    const chkFixture = TestBed.createComponent(ZCheckboxComponent);
    chkFixture.componentInstance.setDisabledState(true);
    chkFixture.detectChanges();
    expect(chkFixture.nativeElement.querySelector('input').disabled).toBe(true);
  });

  it('should format decimal numbers when mode is decimal in ZInputNumberComponent', () => {
    const numFixture = TestBed.createComponent(ZInputNumberComponent);
    numFixture.componentRef.setInput('mode', 'decimal');
    numFixture.componentInstance.writeValue(15);
    numFixture.detectChanges();
    expect(numFixture.nativeElement.querySelector('input').value).toBe('15');
  });
});
