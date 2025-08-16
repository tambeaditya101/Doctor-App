import { Alert } from '../Alert';
import Button from '../Button';

export default function LockedView({
  err,
  otp,
  serverOtp,
  timeLeft,
  onChangeOtp,
  onConfirm,
  appointmentId,
  otpInputRef,
}) {
  return (
    <div className='space-y-3'>
      {err && <Alert kind='error'>{err}</Alert>}

      <Alert kind='info'>
        Slot locked for {timeLeft}s. Please enter OTP{' '}
        <span className='font-mono'>{serverOtp}</span>
      </Alert>

      <div>
        <label className='block text-sm font-medium'>Enter OTP</label>
        <input
          ref={otpInputRef}
          value={otp}
          onChange={(e) => onChangeOtp(e.target.value)}
          className='border p-2 rounded w-full'
        />
      </div>

      <Button onClick={onConfirm} disabled={!otp}>
        Confirm Appointment
      </Button>

      <div className='text-xs text-slate-400'>ID: {appointmentId}</div>
    </div>
  );
}
