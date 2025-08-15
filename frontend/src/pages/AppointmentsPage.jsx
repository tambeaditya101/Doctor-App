import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { Alert } from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { fmtDateTime } from '../utils/format';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // all | booked | completed | cancelled
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/appointments'); // backend should return all user's appointments
      setAppointments(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not fetch appointments');
    } finally {
      setLoading(false);
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

      {/* Filters */}
      <div className='flex gap-2'>
        {['all', 'booked', 'completed', 'cancelled'].map((status) => (
          <Button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? 'bg-blue-600' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
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
            <Card key={appt.id}>
              <div className='font-semibold'>{appt.doctor_name}</div>
              <div className='text-sm text-slate-400'>
                {fmtDateTime(appt.start_time)} → {fmtDateTime(appt.end_time)}
              </div>
              <div className='text-sm'>
                Status: <span className='capitalize'>{appt.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
