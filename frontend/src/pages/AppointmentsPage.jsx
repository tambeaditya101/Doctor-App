import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { Alert } from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { fmtDateTime } from '../utils/format';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [cancelling, setCancelling] = useState(null); // track id being cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data?.data || []); // backend sends { msg, data: [...] }
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?'))
      return;
    try {
      setCancelling(id);
      await api.patch(`/appointments/${id}/cancel`); // backend should update status
      // update UI immediately
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: 'cancelled' } : appt
        )
      );
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not cancel appointment');
    } finally {
      setCancelling(null);
    }
  };

  const filteredAppointments =
    statusFilter === 'all'
      ? appointments
      : appointments.filter(
          (appt) => appt.status?.toLowerCase() === statusFilter
        );

  return (
    <div className='max-w-3xl mx-auto space-y-4'>
      <h1 className='text-xl font-semibold'>My Appointments</h1>

      {/* Filters with counts */}
      <div className='flex gap-2'>
        {['all', 'booked', 'completed', 'cancelled'].map((status) => {
          const count =
            status === 'all'
              ? appointments.length
              : appointments.filter(
                  (appt) => appt.status?.toLowerCase() === status
                ).length;

          return (
            <Button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'bg-blue-600' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </Button>
          );
        })}
      </div>

      {/* Content */}
      {loading && <Spinner label='Loading appointments...' />}
      {err && <Alert kind='error'>{err}</Alert>}

      {!loading && !err && filteredAppointments.length === 0 && (
        <Alert kind='info'>No appointments found.</Alert>
      )}

      {!loading && !err && filteredAppointments.length > 0 && (
        <div className='space-y-3'>
          {filteredAppointments.map((appt) => (
            <Card key={appt.id} className='space-y-2'>
              <div className='font-semibold'>{appt.doctor_name}</div>
              <div className='text-sm text-slate-400'>
                {fmtDateTime(appt.start_time)} → {fmtDateTime(appt.end_time)}
              </div>
              <div className='text-sm'>
                Status:{' '}
                <span className='capitalize font-medium'>{appt.status}</span>
              </div>

              {/* Cancel button only for booked */}
              {appt.status === 'booked' && (
                <Button
                  onClick={() => handleCancel(appt.id)}
                  disabled={cancelling === appt.id}
                  className='bg-red-600 hover:bg-red-700'
                >
                  {cancelling === appt.id
                    ? 'Cancelling...'
                    : 'Cancel Appointment'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
