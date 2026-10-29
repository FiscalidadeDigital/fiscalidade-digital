export type RegistrationForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
};

export type ResetPasswordForm = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

export type FieldErrors<Form extends object> = Partial<Record<keyof Form, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Indique o email da conta.';
  if (!emailPattern.test(email)) return 'Indique um email válido.';
  return undefined;
}

function validatePassword(password: string): string | undefined {
  return password.length < 12 ? 'A palavra-passe deve ter pelo menos 12 caracteres.' : undefined;
}

export function validateRegistrationForm(form: RegistrationForm): FieldErrors<RegistrationForm> {
  const errors: FieldErrors<RegistrationForm> = {};
  if (!form.name.trim()) errors.name = 'Indique o seu nome completo.';
  errors.email = validateEmail(form.email);
  errors.password = validatePassword(form.password);
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'As palavras-passe não coincidem.';
  if (!form.acceptTerms) errors.acceptTerms = 'É necessário aceitar os Termos de Utilização.';
  if (!form.acceptPrivacyPolicy) errors.acceptPrivacyPolicy = 'É necessário aceitar a Política de Privacidade.';
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message))) as FieldErrors<RegistrationForm>;
}

export function validateResetPasswordForm(form: ResetPasswordForm): FieldErrors<ResetPasswordForm> {
  const errors: FieldErrors<ResetPasswordForm> = {};
  errors.email = validateEmail(form.email);
  if (form.code.length !== 6) errors.code = 'Introduza o código de 6 dígitos recebido.';
  errors.password = validatePassword(form.password);
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'As palavras-passe não coincidem.';
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message))) as FieldErrors<ResetPasswordForm>;
}

export function normalizeRecoveryEmail(email: string): string {
  return email.trim().toLowerCase();
}
