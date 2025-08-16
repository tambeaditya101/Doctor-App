import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axiosInstance';

export function useBooking(availabilityId, onSuccessNav) {
  // locking | locked | confirming | done | expired | error
  const [phase, setPhase] = useState('locking');
  const [err, setErr] = useState('');
  const [appointmentId, setAppointmentId] = useState(null);
  const [serverOtp, setServerOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef(null);
  const didLock = useRef(false);
  const otpInputRef = useRef(null);

  // --- helpers ---
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

  // --- API calls ---
  const lockSlot = useCallback(async () => {
    setErr('');
    setPhase('locking');
    resetBookingState();

    try {
      const res = await api.post('/appointments/book', {
        availability_id: availabilityId,
      });

      setAppointmentId(res.data.appointment_id);
      setServerOtp(res.data.otp || '');
      setPhase('locked');

      const expiry = new Date(res.data.locked_until).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));

      startTimer(diff);
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
  }, [availabilityId, resetBookingState, startTimer]);

  const confirm = useCallback(async () => {
    setErr('');
    setPhase('confirming');
    try {
      await api.post('/appointments/confirm', {
        appointment_id: appointmentId,
        otp,
      });
      clearTimer();
      setPhase('done');
      if (onSuccessNav) setTimeout(onSuccessNav, 1200);
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
        setPhase('locked');
      }
    }
  }, [appointmentId, otp, clearTimer, resetBookingState, onSuccessNav]);

  // --- lifecycle ---
  useEffect(() => {
    if (!availabilityId) return;
    if (!didLock.current) {
      didLock.current = true;
      lockSlot();
    }
    return () => {
      clearTimer();
    };
  }, [availabilityId, lockSlot, clearTimer]);

  return {
    phase,
    err,
    otp,
    setOtp,
    appointmentId,
    serverOtp,
    timeLeft,
    lockSlot,
    confirm,
    otpInputRef,
  };
}
