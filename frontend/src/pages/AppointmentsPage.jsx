import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { Alert } from '../components/Alert';
import Spinner from '../components/Spinner';
import AppointmentCard from '../components/appointments/AppointmentCard.jsx';
import AppointmentsTabs from '../components/appointments/AppointmentsTabs.jsx';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('booked');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const tabs = ['all', 'booked', 'completed', 'cancelled'];

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data?.data || []);
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
      await api.patch(`/appointments/${id}/cancel`);
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
    <div className='max-w-3xl mx-auto space-y-6'>
      <h1 className='text-2xl font-bold text-slate-100'>My Appointments</h1>

      <AppointmentsTabs
        tabs={tabs}
        active={statusFilter}
        appointments={appointments}
        onChange={setStatusFilter}
      />

      {loading && <Spinner label='Loading appointments...' />}
      {err && <Alert kind='error'>{err}</Alert>}

      {!loading && !err && filteredAppointments.length === 0 && (
        <Alert kind='info'>No appointments found.</Alert>
      )}

      {!loading && !err && filteredAppointments.length > 0 && (
        <div className='space-y-3'>
          {filteredAppointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))}
        </div>
      )}
    </div>
  );
}
