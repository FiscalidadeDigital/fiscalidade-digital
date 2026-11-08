type Props = {
  obligations: any[];
};

const money = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ObligationTable({
  obligations,
}: Props) {
  return (
    <table className="w-full min-w-[720px] text-left">
      <thead>
        <tr>
          <th className="px-5 py-3">Título</th>
          <th className="px-4 py-3">Tipo</th>
          <th className="px-4 py-3 text-right">Valor</th>
          <th className="px-4 py-3">Estado</th>
          <th className="px-5 py-3 text-right">Vencimento</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-[var(--fd-border)]">
        {obligations.map((item) => (
          <tr key={item.id}>
            <td className="px-5 py-4 font-semibold text-[var(--fd-text-primary)]">
              {item.title}
            </td>
            <td className="px-4 py-4 text-[var(--fd-text-secondary)]">
              {item.type}
            </td>
            <td className="px-4 py-4 text-right font-semibold tabular-nums text-[var(--fd-text-primary)]">
              {item.amount === null || item.amount === undefined
                ? '—'
                : money.format(Number(item.amount))}
            </td>
            <td className="px-4 py-4">
              <span className="fd-status text-[var(--fd-text-secondary)]">
                {item.status}
              </span>
            </td>
            <td className="px-5 py-4 text-right text-[var(--fd-text-secondary)]">
              {new Date(item.dueDate).toLocaleDateString('pt-AO')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
