import {
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import Input from "@/design-system/atoms/Input";
import Textarea from "@/design-system/atoms/Textarea";
import { formControlClass } from "@/design-system/atoms/formControlStyles";
export const inputClass = formControlClass;
export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-6 text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
export function TextField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={props.id || id}>
      <Input {...props} id={props.id || id} />
    </Field>
  );
}
export function TextAreaField({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={props.id || id}>
      <Textarea
        rows={4}
        {...props}
        id={props.id || id}
      />
    </Field>
  );
}
export function SelectField({
  label,
  hint,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={props.id || id}>
      <select {...props} id={props.id || id} className={inputClass}>
        {children}
      </select>
    </Field>
  );
}
