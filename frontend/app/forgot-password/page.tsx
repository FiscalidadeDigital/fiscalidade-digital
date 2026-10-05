'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    try { await api.post('/auth/forgot-password', { email }); } finally { setSent(true); setLoading(false); }
  }
  return <main className="fd-auth-page grid min-h-screen place-items-center bg-[#f3f5f7] p-4 text-[#172642]"><section className="w-full max-w-md rounded-xl border border-[#d9e0e7] bg-white p-6 shadow-sm sm:p-8"><h1 className="text-2xl font-semibold">Recuperar acesso</h1>{sent ? <><p className="mt-4 text-sm leading-6 text-[#526174]">Se existir uma conta associada, enviámos um código de recuperação.</p><Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="mt-6 block rounded-md bg-[#0b6f93] p-3 text-center font-semibold text-white">Introduzir código</Link></> : <form onSubmit={submit}><p className="mt-2 text-sm leading-6 text-[#66758d]">Indique o email da conta. A resposta é sempre igual para proteger a sua privacidade.</p><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-6 w-full rounded-md border p-3" placeholder="Email" /><button disabled={loading} className="mt-4 w-full rounded-md bg-[#0b6f93] p-3 font-semibold text-white disabled:opacity-60">{loading ? 'A enviar…' : 'Enviar instruções'}</button></form>}</section></main>;
}
