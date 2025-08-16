import { fmtDateTime } from '../../utils/format';
import Button from '../Button';
import Card from '../Card';

export default function AppointmentCard({ appt, onCancel, cancelling }) {
  return (
    <Card className='space-y-2 hover:shadow-md transition-shadow'>
      <div className='font-semibold text-slate-100'>
        {appt.doctor_name} — {appt.specialization}
      </div>

      <div className='text-sm text-slate-400'>
        {fmtDateTime(appt.start_time)} → {fmtDateTime(appt.end_time)}
      </div>

      <div className='text-sm'>
        Status:{' '}
        <span
          className={`capitalize font-medium ${
            appt.status === 'booked'
              ? 'text-blue-400'
              : appt.status === 'completed'
              ? 'text-green-400'
              : 'text-red-400'
          }`}
        >
          {appt.status}
        </span>
      </div>

      {appt.status === 'booked' && (
        <Button
          onClick={() => onCancel(appt.id)}
          disabled={cancelling === appt.id}
          className='bg-red-600 hover:bg-red-700'
        >
          {cancelling === appt.id ? 'Cancelling...' : 'Cancel Appointment'}
        </Button>
      )}
    </Card>
  );
}
