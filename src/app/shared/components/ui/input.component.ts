import { Component, input, output, signal, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'skuvo-input',
  standalone: true,
  imports: [FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputComponent), multi: true }],
  template: `
    <div class="space-y-1.5">
      @if (label()) {
        <label class="block text-xs font-medium text-neutral-600 dark:text-neutral-400">{{ label() }}</label>
      }
      <div class="relative">
        @if (prefix()) {
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">{{ prefix() }}</span>
        }
        <input [type]="type()" [placeholder]="placeholder()" [disabled]="disabled()" [required]="required()"
               [ngModel]="value()" (ngModelChange)="onValueChange($event)"
               [class]="inputClasses()" />
      </div>
      @if (error()) {
        <p class="text-xs text-red-500">{{ error() }}</p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  type = input('text');
  label = input('');
  placeholder = input('');
  error = input('');
  disabled = input(false);
  required = input(false);
  prefix = input('');

  value = signal('');
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string): void { this.value.set(v ?? ''); }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  onValueChange(v: string): void {
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
  }

  inputClasses(): string {
    const base = 'w-full bg-neutral-50 dark:bg-neutral-800 border text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200';
    const size = 'px-3.5 py-2.5';
    const border = this.error() ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700';
    const indent = this.prefix() ? 'pl-8' : 'rounded-xl';
    return [base, size, border, indent].join(' ');
  }
}
