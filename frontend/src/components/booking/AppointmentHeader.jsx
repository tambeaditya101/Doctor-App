import { fmtDateTime, fmtTime } from '../../utils/format';
import Card from '../Card';

export default function AppointmentHeader({ state }) {
  return (
    <Card>
      <div className='font-semibold'>{state?.doctorName}</div>
      <div className='text-sm text-slate-400'>
        {fmtDateTime(state?.timeFrom)} → {fmtTime(state?.timeTo)}
      </div>
    </Card>
  );
}
