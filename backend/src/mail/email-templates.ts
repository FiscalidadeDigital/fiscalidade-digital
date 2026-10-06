const NAVY = '#071A2F';
const CYAN = '#0891B2';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] as string);
}

export function renderEmailHtml(title: string, content: string, action?: { label: string; url: string }) {
  const button = action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="background:${CYAN};border-radius:6px;color:#fff;display:inline-block;font-weight:700;padding:13px 20px;text-decoration:none">${escapeHtml(action.label)}</a></p>`
    : '';
  return `<!doctype html><html lang="pt"><body style="background:#F4F7FA;color:#26364A;font-family:Arial,sans-serif;margin:0;padding:24px"><div style="margin:0 auto;max-width:600px"><div style="background:${NAVY};color:#fff;padding:22px 28px"><strong style="font-size:20px">Fiscalidade <span style="color:#67E8F9">Digital</span></strong><div style="color:#CBD5E1;font-size:11px;margin-top:6px">GESTÃO FISCAL PARA EMPRESAS EM ANGOLA</div></div><main style="background:#fff;padding:30px 28px"><h1 style="color:${NAVY};font-size:24px;margin:0 0 18px">${escapeHtml(title)}</h1>${content}${button}</main><footer style="color:#64748B;font-size:12px;padding:18px 4px">Fiscalidade Digital · Gestão fiscal mais clara para empresas em Angola.<br><a href="https://fiscalidadedigital.ao" style="color:${CYAN}">fiscalidadedigital.ao</a></footer></div></body></html>`;
}

export function verificationEmail(name: string, code: string) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  return renderEmailHtml('Confirme o seu endereço de email', `<p>Olá, ${safeName}.</p><p>Recebemos um pedido para criar uma conta na Fiscalidade Digital.</p><div style="background:#F4F7FA;color:${NAVY};font-size:32px;font-weight:700;letter-spacing:8px;padding:18px;text-align:center">${safeCode}</div><p>Este código é válido por 10 minutos e só pode ser utilizado uma vez.</p><p>Se não iniciou este registo, pode ignorar esta mensagem. Nunca partilhe este código.</p>`);
}

export function passwordRecoveryEmail(name: string, code: string) {
  return renderEmailHtml('Recuperação de acesso', `<p>Olá, ${escapeHtml(name)}.</p><p>Recebemos um pedido para redefinir a palavra-passe da sua conta.</p><div style="background:#F4F7FA;color:${NAVY};font-size:32px;font-weight:700;letter-spacing:8px;padding:18px;text-align:center">${escapeHtml(code)}</div><p>Este código é válido por 10 minutos.</p><p>Se não solicitou esta alteração, ignore esta mensagem. A sua palavra-passe não será alterada sem concluir o processo.</p>`);
}

export function invitationEmail(company: string, role: string, inviter: string, url: string) {
  return renderEmailHtml(`Foi convidado para ${escapeHtml(company)}`, `<p>${escapeHtml(inviter)} convidou-o para integrar a equipa da Fiscalidade Digital.</p><p>Função atribuída: <strong>${escapeHtml(role)}</strong></p><p>O convite é válido por 48 horas.</p>`, { label: 'ACEITAR CONVITE', url });
}

export function obligationEmail(company: string, title: string, period: string, dueDate: string, status: string, url?: string) {
  return renderEmailHtml('Alerta de obrigação fiscal', `<p><strong>Empresa:</strong> ${escapeHtml(company)}</p><p><strong>Obrigação:</strong> ${escapeHtml(title)}</p><p><strong>Período:</strong> ${escapeHtml(period)}</p><p><strong>Vencimento:</strong> ${escapeHtml(dueDate)}</p><p><strong>Estado:</strong> ${escapeHtml(status)}</p>`, url ? { label: 'VER OBRIGAÇÃO', url } : undefined);
}

export function plainText(lines: string[]) {
  return lines.join('\n\n');
}
