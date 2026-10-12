const INPUT_CLASSES =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100';

export function Field({ label, hint = null, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextInput(props) {
  return <input className={INPUT_CLASSES} {...props} />;
}

export function SelectInput({ children, ...props }) {
  return (
    <select className={INPUT_CLASSES} {...props}>
      {children}
    </select>
  );
}
