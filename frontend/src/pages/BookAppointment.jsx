import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Alert } from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import { fmtDateTime, fmtTime } from '../utils/format';

export default function BookAppointment() {
  const nav = useNavigate();
  const { state } = useLocation() || {};

  const [phase, setPhase] = useState('locking'); // locking | locked | confirming | done | expired
  const [err, setErr] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [serverOtp, setServerOtp] = useState('');
  const [otp, setOtp] = useState('');

  const [timeLeft, setTimeLeft] = useState(300); // 5 min in seconds
  const timerRef = useRef(null);

  useEffect(() => {
    if (!state?.availabilityId) {
      nav('/');
      return;
    }
    lockSlot();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const lockSlot = async () => {
    setErr('');
    setPhase('locking');
    setTimeLeft(300);
    try {
      const res = await api.post('/appointments/book', {
        availability_id: state.availabilityId,
      });
      setAppointmentId(res.data.appointment_id);
      setServerOtp(res.data.otp || ''); // Dummy OTP
      setPhase('locked');
      startTimer();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not lock slot');
      setPhase('locking');
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
      setTimeout(() => nav('/appointments'), 1200);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Confirmation failed');
      setPhase('locked');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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

      {phase === 'locked' && (
        <Card className='space-y-3'>
          {err && <Alert kind='error'>{err}</Alert>}

          {/* Timer & OTP */}
          <div className='flex items-center justify-between'>
            <span className='text-sm text-slate-400'>
              Time left:{' '}
              <span className='text-slate-200 font-mono'>
                {formatTime(timeLeft)}
              </span>
            </span>
            {serverOtp && (
              <span className='text-sm text-slate-400'>
                OTP:{' '}
                <span className='text-slate-200 font-mono'>{serverOtp}</span>
              </span>
            )}
          </div>

          {/* OTP input */}
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
        </Card>
      )}

      {phase === 'confirming' && <Spinner label='Confirming…' />}

      {phase === 'done' && (
        <Card>
          <Alert kind='success'>Appointment booked!</Alert>
        </Card>
      )}

      {phase === 'expired' && (
        <Card>
          <Alert kind='error'>Slot expired! Please book again.</Alert>
          <Button onClick={lockSlot}>Book Again</Button>
        </Card>
      )}
    </div>
  );
}
