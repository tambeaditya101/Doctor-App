import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

export default function Home() {
  const nav = useNavigate();
  const [filters, setFilters] = useState({ specialization: '', mode: '' });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      if (filters.specialization)
        params.set('specialization', filters.specialization);
      if (filters.mode) params.set('mode', filters.mode);
      const res = await axios.get(`/doctors/discover?${params.toString()}`);
      setRows(res.data || []);
    } catch (e) {
      setErr('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      <div className='card'>
        <h2 className='text-lg font-semibold mb-3'>Find Doctors</h2>
        <div className='grid gap-3 sm:grid-cols-3'>
          <div>
            <div className='label'>Specialization</div>
            <input
              className='input'
              placeholder='Dentist, Cardiologist…'
              value={filters.specialization}
              onChange={(e) =>
                setFilters({ ...filters, specialization: e.target.value })
              }
            />
          </div>
          <div>
            <div className='label'>Mode</div>
            <select
              className='input'
              value={filters.mode}
              onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
            >
              <option value=''>Any</option>
              <option value='online'>Online</option>
              <option value='in-person'>In-person</option>
            </select>
          </div>
          <div className='flex items-end'>
            <button className='btn w-full' onClick={load}>
              Search
            </button>
          </div>
        </div>
      </div>

      <div className='space-y-2'>
        {loading && <div className='text-slate-400'>Loading…</div>}
        {err && <div className='text-red-400'>{err}</div>}
        {!loading && rows.length === 0 && (
          <div className='text-slate-400'>No results.</div>
        )}

        {rows.map((r, i) => (
          <div key={i} className='card flex items-center justify-between'>
            <div>
              <div className='font-semibold'>
                {r.name} <span className='badge'>{r.mode}</span>
              </div>
              <div className='text-sm text-slate-400'>{r.specialization}</div>
              <div className='text-sm text-slate-400'>
                {new Date(r.available_from).toLocaleString()} →{' '}
                {new Date(r.available_till).toLocaleTimeString()}
              </div>
            </div>
            <div>
              <button
                className='btn'
                disabled={!r.availability_id}
                onClick={() => onBook(r)}
              >
                Book
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
