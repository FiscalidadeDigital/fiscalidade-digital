'use client';

import {
  type FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthFrame from '@/components/auth/AuthFrame';
import api from '@/services/api';

type VerifyFieldErrors = {
  email?: string;
  code?: string;
};

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<VerifyFieldErrors>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const focusFirstErrorRef = useRef(false);

  useEffect(() => {
    if (!focusFirstErrorRef.current) {
      return;
    }

    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
    focusFirstErrorRef.current = false;
  }, [fieldErrors]);

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) {
      return 'Introduza o email utilizado no registo.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return 'Introduza um email válido.';
    }

    return undefined;
  }

  function validateForm(): VerifyFieldErrors {
    const errors: VerifyFieldErrors = {
      email: validateEmail(email),
    };

    if (code.length !== 6) {
      errors.code = 'Introduza o código de 6 dígitos recebido.';
    }

    return Object.fromEntries(
      Object.entries(errors).filter(([, message]) => Boolean(message)),
    ) as VerifyFieldErrors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || resending) {
      return;
    }

    const nextFieldErrors = validateForm();
    focusFirstErrorRef.current = Object.keys(nextFieldErrors).length > 0;
    setFieldErrors(nextFieldErrors);
    setError('');
    setNotice('');

    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-email', { email, code });
      sessionStorage.setItem('fd-onboarding-token', data.onboardingToken);
      router.replace('/onboarding');
    } catch {
      setError('Não foi possível confirmar este código. Verifique os dados ou solicite um novo código.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (loading || resending) {
      return;
    }

    const emailError = validateEmail(email);

    if (emailError) {
      focusFirstErrorRef.current = true;
      setFieldErrors({ email: emailError });
      setError('');
      return;
    }

    setResending(true);
    setFieldErrors({});
    setError('');
    setNotice('');

    try {
      await api.post('/auth/resend-verification', { email });
      setNotice('Se existir um registo pendente, enviámos novas instruções. Aguarde antes de pedir outro código.');
    } catch (cause: unknown) {
      const status = (cause as { response?: { status?: number } })?.response?.status;
      setError(
        status === 429
          ? 'Aguarde antes de pedir um novo código.'
          : 'Não foi possível reenviar o código agora. Tente novamente mais tarde.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Confirmar email"
      title="Confirme o email"
      description="Introduza o código de seis dígitos enviado para o seu email. O código é temporário e só pode ser utilizado uma vez."
      backHref="/register"
      backLabel="Voltar ao registo"
    >
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
        <label htmlFor="verify-email" className="fd-label">
          Email
          <input
            id="verify-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            disabled={loading || resending}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
              setError('');
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'verify-email-error' : undefined}
            className="fd-field mt-1.5"
          />
          {fieldErrors.email ? (
            <span id="verify-email-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>

        <label htmlFor="verify-code" className="fd-label">
          Código de confirmação
          <input
            id="verify-code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            disabled={loading || resending}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, ''));
              setFieldErrors((current) => ({ ...current, code: undefined }));
              setError('');
            }}
            aria-invalid={Boolean(fieldErrors.code)}
            aria-describedby={fieldErrors.code ? 'verify-code-error' : undefined}
            className="fd-field mt-1.5 text-center text-lg tracking-[.35em]"
            placeholder="000000"
          />
          {fieldErrors.code ? (
            <span id="verify-code-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">
              {fieldErrors.code}
            </span>
          ) : null}
        </label>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        ) : null}

        <button disabled={loading || resending} aria-busy={loading} className="fd-button-primary w-full">
          {loading ? 'A confirmar…' : 'Confirmar email'}
        </button>
        <button type="button" onClick={() => void resend()} disabled={loading || resending} aria-busy={resending} className="fd-button-secondary w-full">
          {resending ? 'A reenviar…' : 'Reenviar código'}
        </button>
      </form>
    </AuthFrame>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-slate-100 p-4 text-sm text-slate-600">A carregar…</main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
