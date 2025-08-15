export function Alert({ kind = 'info', children }) {
  const styles = {
    info: 'bg-slate-900 border-slate-800 text-slate-200',
    error: 'bg-red-950/40 border-red-800/60 text-red-200',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
    warn: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
  };
  return (
    <div
      className={
        'rounded-xl border px-3.5 py-2.5 text-sm ' +
        (styles[kind] || styles.info)
      }
    >
      {children}
    </div>
  );
}
