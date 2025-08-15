import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Alert } from '../components/Alert';
import Button from '../components/BUtton'; // fixed import name
import Card from '../components/Card';
import Select from '../components/Select';
import SpecializationSelect from '../components/SpecializationSelect';
import Spinner from '../components/Spinner';
import { fmtDateTime, fmtTime } from '../utils/format';

export default function Discover() {
  const nav = useNavigate();

  // initialize from localStorage so values persist across refresh
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('doctorFilters');
      return saved ? JSON.parse(saved) : { specialization: '', mode: '' };
    } catch {
      return { specialization: '', mode: '' };
    }
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // load doctors with optional filters
  const load = async (appliedFilters = filters) => {
    setLoading(true);
    setErr('');
    try {
      // build query string from non-empty filter values
      const q = new URLSearchParams(
        Object.entries(appliedFilters).filter(([_, v]) => v)
      );
      const res = await api.get(`/doctors/discover?${q.toString()}`);
      // backend returns an array (res.data)
      setRows(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (e) {
      console.error('discover error', e);
      setErr('Failed to load doctors');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // persist filters on change
  useEffect(() => {
    try {
      localStorage.setItem('doctorFilters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  // initial load once (filters already initialized from localStorage)
  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const onBook = (r) => {
    nav('/book', {
      state: {
        doctorId: r.id,
        availabilityId: r.availability_id,
        doctorName: r.name,
        timeFrom: r.available_from,
        timeTo: r.available_till,
      },
    });
  };

  return (
    <div className='space-y-4'>
      <Card>
        <h2 className='text-lg font-semibold mb-3'>Find Doctors</h2>
        <div className='grid gap-3 sm:grid-cols-3'>
          <SpecializationSelect
            value={filters.specialization}
            onChange={(val) =>
              setFilters((f) => ({ ...f, specialization: val }))
            }
          />

          <Select
            label='Mode'
            value={filters.mode}
            onChange={(e) =>
              setFilters((f) => ({ ...f, mode: e.target.value }))
            }
          >
            <option value=''>Any</option>
            <option value='online'>Online</option>
            <option value='in-person'>In-person</option>
          </Select>

          <div className='flex items-end'>
            <Button className='w-full' onClick={() => load()}>
              Search
            </Button>
          </div>
        </div>
      </Card>

      {loading && <Spinner label='Loading…' />}
      {err && <Alert kind='error'>{err}</Alert>}

      <div className='space-y-2'>
        {!loading && rows.length === 0 && (
          <div className='text-slate-400'>No results.</div>
        )}

        {rows.map((r, idx) => (
          <Card key={idx} className='flex items-center justify-between'>
            <div>
              <div className='font-semibold'>
                {r.name}{' '}
                <span className='ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-200'>
                  {r.mode}
                </span>
              </div>
              <div className='text-sm text-slate-400'>{r.specialization}</div>
              <div className='text-sm text-slate-400'>
                {fmtDateTime(r.available_from)} → {fmtTime(r.available_till)}
              </div>
            </div>

            <Button disabled={!r.availability_id} onClick={() => onBook(r)}>
              Book
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
