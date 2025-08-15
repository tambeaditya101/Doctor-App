export default function Card({ className = '', children }) {
  return (
    <div
      className={
        'bg-slate-950/70 border border-slate-800 rounded-2xl p-5 ' + className
      }
    >
      {children}
    </div>
  );
}
