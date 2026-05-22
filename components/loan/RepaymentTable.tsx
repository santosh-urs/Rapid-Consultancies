'use client';

interface RepaymentTableProps {
  rows: Array<{ date: string; amount: number; status: string }>;
}

export function RepaymentTable({ rows }: RepaymentTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#E5E5E5] bg-surface">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-white">
          <tr>
            <th className="border-b border-[#E5E5E5] px-4 py-3">Date</th>
            <th className="border-b border-[#E5E5E5] px-4 py-3">Amount</th>
            <th className="border-b border-[#E5E5E5] px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} className="border-b border-[#E5E5E5] bg-white last:border-none">
              <td className="px-4 py-3 text-[#555555]">{row.date}</td>
              <td className="px-4 py-3 font-semibold text-text">₹{row.amount.toLocaleString('en-IN')}</td>
              <td className="px-4 py-3 text-[#555555]">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
