import { fmtDateTime, fmtTime } from '../../utils/format';
import Button from '../Button';
import Card from '../Card';

export default function DoctorCard({ doctor, onBook }) {
  return (
    <Card className='space-y-2'>
      <div className='flex justify-between items-center'>
        <div>
          <div className='font-semibold flex items-center gap-2'>
            {doctor.name}
            <span className='text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 capitalize'>
              {doctor.mode}
            </span>
          </div>
          <div className='text-sm text-slate-400'>{doctor.specialization}</div>
          <div className='text-sm text-slate-400'>
            {fmtDateTime(doctor.available_from)} →{' '}
            {fmtTime(doctor.available_till)}
          </div>
        </div>

        <Button
          disabled={!doctor.availability_id}
          onClick={() => onBook(doctor)}
          className='bg-blue-600 hover:bg-blue-700'
        >
          Book
        </Button>
      </div>
    </Card>
  );
}
