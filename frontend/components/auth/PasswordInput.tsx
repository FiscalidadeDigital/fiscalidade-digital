'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  helperText?: string;
  disabled?: boolean;
};

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  helperText,
  disabled = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="fd-label">
        {label}
        <span className="relative mt-1.5 block">
          <input
            id={id}
            required
            minLength={12}
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={[helperText ? helperId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
            className="fd-field pr-12"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
            className="absolute inset-y-0 right-0 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-r-[0.625rem] text-slate-500 transition hover:text-[#0b6f93]"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {helperText && <p id={helperId} className="mt-1.5 text-xs leading-5 text-slate-500">{helperText}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
