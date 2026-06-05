type Props = {
  obligations: any[];
};

export default function ObligationTable({
  obligations,
}: Props) {
  return (
    <table className="w-full bg-white rounded shadow">
      <thead>
        <tr>
          <th>Título</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Estado</th>
          <th>Vencimento</th>
        </tr>
      </thead>

      <tbody>
        {obligations.map((item) => (
          <tr key={item.id}>
            <td>{item.title}</td>
            <td>{item.type}</td>
            <td>{item.amount}</td>
            <td>{item.status}</td>
            <td>
              {new Date(
                item.dueDate,
              ).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}