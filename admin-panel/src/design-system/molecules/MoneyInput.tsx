import { useEffect, useId, useRef, type InputHTMLAttributes } from 'react';
import { formatMoneyInput, normalizeMoney } from '../../shared/utils/money-input';
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'> & {
  value: string | number; onChange: (raw: string) => void; min?: number; max?: number;
};
export default function MoneyInput({ value, onChange, min = 0, max, ...props }: Props) {
  const ref = useRef<HTMLInputElement>(null), id = useId();
  const formatted = formatMoneyInput(value);
  useEffect(() => {
    const number = Number(value);
    ref.current?.setCustomValidity(value !== '' && (!Number.isFinite(number) || number < min || max != null && number > max) ? 'مبلغ خارج از بازه مجاز است.' : '');
  }, [value, min, max]);
  return <div className="money-input" dir="ltr"><input {...props} ref={ref} type="text" inputMode="decimal" dir="ltr" value={formatted} aria-describedby={[props['aria-describedby'], id].filter(Boolean).join(' ')} onChange={event => {
    const input = event.currentTarget, raw = normalizeMoney(input.value);
    if (raw == null) return;
    const count = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/[,٬\s]/g, '').length;
    onChange(raw);
    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      let position = 0, seen = 0;
      while (position < input.value.length && seen < count) { if (input.value[position] !== ',') seen++; position++; }
      input.setSelectionRange(position, position);
    });
  }} /><span id={id} dir="rtl">تومان</span></div>;
}
