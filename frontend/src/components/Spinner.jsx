export default function Spinner({ label }) {
  return (
    <div className='flex items-center gap-2 text-slate-400'>
      <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
          fill='none'
        />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
        />
      </svg>
      {label && <span>{label}</span>}
    </div>
  );
}
