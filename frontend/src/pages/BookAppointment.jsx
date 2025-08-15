import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Alert } from '../components/Alert';
import Button from '../components/BUtton';
import Card from '../components/Card';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import { fmtDateTime, fmtTime } from '../utils/format';

export default function BookAppointment() {
  const nav = useNavigate();
  const { state } = useLocation() || {};
  const [phase, setPhase] = useState('locking'); // locking | locked | confirming | done | error
  const [err, setErr] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [serverOtp, setServerOtp] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!state?.availabilityId) {
      nav('/');
      return;
    }
    lockSlot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lockSlot = async () => {
    setErr('');
    setPhase('locking');
    try {
      const res = await api.post('/appointments/book', {
        availability_id: state.availabilityId,
      });
      setAppointmentId(res.data.appointment_id);
      setServerOtp(res.data.otp || ''); // PoC only
      setPhase('locked');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not lock slot');
      setPhase('error'); // ✅ show error state instead of staying in "locking"
    }
  };

  const confirm = async () => {
    setErr('');
    setPhase('confirming');
    try {
      await api.post('/appointments/confirm', {
        appointment_id: appointmentId,
        otp,
      });
      setPhase('done');
      setTimeout(() => nav('/'), 1200);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Confirmation failed');
      setPhase('locked'); // ✅ back to locked so user can retry OTP
    }
  };

  return (
    <div className='max-w-lg mx-auto space-y-4'>
      <Card>
        <h2 className='text-lg font-semibold mb-1'>Book Appointment</h2>
        {state?.doctorName && (
          <div className='text-sm text-slate-400'>
            Doctor: <span className='text-slate-200'>{state.doctorName}</span>
          </div>
        )}
        {state?.timeFrom && (
          <div className='text-sm text-slate-400'>
            Time: {fmtDateTime(state.timeFrom)}
            {state?.timeTo ? ` → ${fmtTime(state.timeTo)}` : ''}
          </div>
        )}
      </Card>

      {phase === 'locking' && (
        <Card>
          <Spinner label='Locking slot…' />
        </Card>
      )}

      {phase === 'error' && (
        <Card className='space-y-3'>
          {err && <Alert kind='error'>{err}</Alert>}
          <Button onClick={lockSlot}>Try Again</Button>
        </Card>
      )}

      {phase !== 'locking' && phase !== 'error' && (
        <Card className='space-y-3'>
          {err && <Alert kind='error'>{err}</Alert>}
          {phase === 'locked' && (
            <>
              {serverOtp && (
                <div className='text-sm text-slate-400'>
                  Test OTP (PoC):{' '}
                  <span className='text-slate-200 font-mono'>{serverOtp}</span>
                </div>
              )}
              <Input
                label='Enter OTP'
                placeholder='6-digit code'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <div className='flex gap-2'>
                <Button onClick={confirm}>Confirm</Button>
                <Button
                  className='bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-900'
                  onClick={lockSlot}
                >
                  Relock
                </Button>
              </div>
            </>
          )}
          {phase === 'confirming' && <Spinner label='Confirming…' />}
          {phase === 'done' && (
            <Alert kind='success'>Appointment booked!</Alert>
          )}
        </Card>
      )}
    </div>
  );
}
