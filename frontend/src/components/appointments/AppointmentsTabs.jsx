export default function AppointmentsTabs({
  tabs,
  active,
  appointments,
  onChange,
}) {
  return (
    <div className='flex border-b border-slate-700'>
      {tabs.map((status) => {
        const count =
          status === 'all'
            ? appointments.length
            : appointments.filter(
                (appt) => appt.status?.toLowerCase() === status
              ).length;

        const isActive = active === status;

        return (
          <button
            key={status}
            onClick={() => onChange(status)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            {isActive && (
              <span className='absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full'></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
