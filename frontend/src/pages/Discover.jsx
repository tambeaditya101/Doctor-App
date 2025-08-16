import { useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import DoctorsList from '../components/discover/DoctorsList';
import Filters from '../components/discover/Filters';
import Greeting from '../components/discover/Greeting';
import Spinner from '../components/Spinner';
import { useDiscover } from '../hooks/useDiscover';

export default function Discover() {
  const nav = useNavigate();
  const { filters, setFilters, rows, loading, err, load } = useDiscover();
  const userName = JSON.parse(localStorage.getItem('user'))?.name || '';

  const onBook = (doctor) => {
    nav(`/book`, {
      state: {
        doctorId: doctor.id,
        availabilityId: doctor.availability_id,
        doctorName: doctor.name,
        timeFrom: doctor.available_from,
        timeTo: doctor.available_till,
      },
    });
  };

  return (
    <div className='max-w-3xl mx-auto space-y-4'>
      <Greeting userName={userName} />

      <Filters
        filters={filters}
        setFilters={setFilters}
        onSearch={() => load()}
      />

      {loading && <Spinner label='Loading doctors…' />}
      {err && <Alert kind='error'>{err}</Alert>}

      {!loading && !err && rows.length === 0 && (
        <Alert kind='info'>No doctors found with selected filters.</Alert>
      )}

      {!loading && !err && rows.length > 0 && (
        <DoctorsList doctors={rows} onBook={onBook} />
      )}
    </div>
  );
}
