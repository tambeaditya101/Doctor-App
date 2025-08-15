export default function Button({ className = '', children, ...props }) {
  return (
    <button
      className={
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
