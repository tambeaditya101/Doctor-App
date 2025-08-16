import { useLocation, useNavigate } from 'react-router-dom';
import AppointmentHeader from '../components/booking/AppointmentHeader';
import ConfirmingView from '../components/booking/ConfirmingView';
import DoneView from '../components/booking/DoneView';
import ErrorView from '../components/booking/ErrorView';
import ExpiredView from '../components/booking/ExpiredView';
import LockedView from '../components/booking/LockedView';
import LockingView from '../components/booking/LockingView';
import { useBooking } from '../hooks/useBooking';

export default function BookAppointment() {
  const nav = useNavigate();
  const { state } = useLocation() || {};

  const {
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
  } = useBooking(state?.availabilityId, () => nav('/appointments'));

  if (!state?.availabilityId) {
    nav('/discover-doc');
    return null;
  }

  return (
    <div className='max-w-lg mx-auto space-y-4'>
      <AppointmentHeader state={state} />

      {phase === 'locking' && <LockingView />}
      {phase === 'error' && (
        <ErrorView
          err={err}
          onRetry={lockSlot}
          onBack={() => nav('/discover-doc')}
        />
      )}
      {phase === 'locked' && (
        <LockedView
          err={err}
          otp={otp}
          serverOtp={serverOtp}
          timeLeft={timeLeft}
          onChangeOtp={setOtp}
          onConfirm={confirm}
          appointmentId={appointmentId}
          otpInputRef={otpInputRef}
        />
      )}
      {phase === 'confirming' && <ConfirmingView />}
      {phase === 'done' && <DoneView />}
      {phase === 'expired' && (
        <ExpiredView onRetry={lockSlot} onBack={() => nav('/discover-doc')} />
      )}
    </div>
  );
}
