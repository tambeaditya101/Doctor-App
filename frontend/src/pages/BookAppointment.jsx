import { useCallback, useEffect, useRef, useState } from 'react';
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

  // locking | locked | confirming | done | expired | error
  const [phase, setPhase] = useState('locking');
  const [err, setErr] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [serverOtp, setServerOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const didLock = useRef(false); // prevent double-fire on mount
  const timerRef = useRef(null);
  const otpInputRef = useRef(null);

  const resetBookingState = useCallback(() => {
    setAppointmentId(null);
    setServerOtp('');
    setOtp('');
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (duration) => {
      clearTimer();
      setTimeLeft(duration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            resetBookingState();
            setPhase('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer, resetBookingState]
  );

  const lockSlot = useCallback(async () => {
    setErr('');
    setPhase('locking');
    resetBookingState();

    try {
      const res = await api.post('/appointments/book', {
        availability_id: state?.availabilityId,
      });

      setAppointmentId(res.data.appointment_id);
      setServerOtp(res.data.otp || ''); // PoC only
      setPhase('locked');

      // derive exact expiry from backend instead of fixed 300s
      const expiry = new Date(res.data.locked_until).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));

      startTimer(diff);

      // tiny delay to ensure input is mounted
      setTimeout(() => otpInputRef.current?.focus(), 0);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        (e?.message?.includes('Network')
          ? 'Network error'
          : 'Could not lock slot');
      setErr(msg);
      setPhase('error');
    }
  }, [state?.availabilityId, resetBookingState, startTimer]);

  const confirm = async () => {
    setErr('');
    setPhase('confirming');
    try {
      await api.post('/appointments/confirm', {
        appointment_id: appointmentId,
        otp,
      });
      clearTimer();
      setPhase('done');
      setTimeout(() => nav('/appointments'), 1200);
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        (e?.message?.includes('Network')
          ? 'Network error'
          : 'Confirmation failed');
      setErr(msg);

      if (msg.toLowerCase().includes('expired')) {
        resetBookingState();
        setPhase('expired');
      } else {
        // allow retry if still valid
        setPhase('locked');
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Mount effects
  useEffect(() => {
    if (!state?.availabilityId) {
      nav('/discover-doc');
      return;
    }
    if (!didLock.current) {
      didLock.current = true;
      lockSlot();
    }
    return () => {
      clearTimer();
    };
  }, [nav, state?.availabilityId, lockSlot, clearTimer]);

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
          <Alert kind='error'>{err}</Alert>
          <div className='flex gap-2'>
            <Button onClick={lockSlot}>Try Again</Button>
            <Button
              className='bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-900'
              onClick={() => nav('/discover-doc')}
            >
              Back
            </Button>
          </div>
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

          <Input
            ref={otpInputRef}
            label='Enter OTP'
            placeholder='6-digit code'
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />

          <div className='flex gap-2'>
            <Button
              onClick={confirm}
              disabled={!appointmentId || otp.length < 4}
            >
              Confirm
            </Button>
          </div>
        </Card>
      )}

      {phase === 'confirming' && (
        <Card>
          <Spinner label='Confirming…' />
        </Card>
      )}

      {phase === 'done' && (
        <Card>
          <Alert kind='success'>Appointment booked!</Alert>
        </Card>
      )}

      {phase === 'expired' && (
        <Card className='space-y-3'>
          <Alert kind='error'>Slot expired! Please book again.</Alert>
          <div className='flex gap-2'>
            <Button onClick={lockSlot}>Book Again</Button>
            <Button
              className='bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-900'
              onClick={() => nav('/discover-doc')}
            >
              Back
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
