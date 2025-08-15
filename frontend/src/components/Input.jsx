export default function Input({ label, hint, className = '', ...props }) {
  return (
    <label className='block'>
      {label && <div className='mb-1 text-sm text-slate-400'>{label}</div>}
      <input
        className={
          'w-full rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 ' +
          className
        }
        {...props}
      />
      {hint && <div className='mt-1 text-xs text-slate-500'>{hint}</div>}
    </label>
  );
}
