export default function KpiCard({ label, value, hint = null, tone = 'slate' }) {
  const accents = {
    slate: 'text-slate-900',
    green: 'text-green-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accents[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
