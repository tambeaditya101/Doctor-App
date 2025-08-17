import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Alert } from '../components/Alert';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import { fmtDateTime, fmtTime } from '../utils/format';

// Utility for computing slot status
const computeStatus = (slot) => {
  const now = Date.now();
  const end = new Date(slot.end_time).getTime();
  if (end < now) return 'expired';
  if (slot.is_booked) return 'booked';
  return 'available';
};

// Map status → CSS classes
const badgeClass = {
  available: 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30',
  booked: 'bg-amber-600/20 text-amber-300 border border-amber-600/30',
  expired: 'bg-rose-600/20 text-rose-300 border border-rose-600/30',
  default: 'bg-slate-700 text-slate-200',
};

export default function AvailabilityList() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | available | booked | expired
  const [q, setQ] = useState(''); // quick filter by doctor/specialization

  // fetch availability (on mount)
  useEffect(() => {
    let active = true;
    const fetchAvailability = async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await api.get('/availability/all');
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data?.availabilities || [];
        if (active) setRows(data);
      } catch (e) {
        if (active) {
          setErr(e?.response?.data?.error || 'Failed to load availability');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAvailability();
    return () => {
      active = false;
    };
  }, []);

  // Memoized filtered + sorted list
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .map((r) => ({ ...r, _status: computeStatus(r) }))
      .filter((r) => statusFilter === 'all' || r._status === statusFilter)
      .filter(
        (r) =>
          !needle ||
          r.doctor_name?.toLowerCase().includes(needle) ||
          r.specialization?.toLowerCase().includes(needle)
      )
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [rows, statusFilter, q]);

  return (
    <div className='space-y-4'>
      <div>
        <h1 className='text-xl font-semibold'>Doctor Availability</h1>
        <p className='text-sm text-slate-400'>
          Inspect all slots (available, booked, expired).
        </p>
      </div>

      <Card>
        <div className='flex flex-col sm:flex-row gap-3 sm:items-end'>
          <div className='flex-1'>
            <div className='text-sm text-slate-400 mb-1'>Quick search</div>
            <input
              className='w-full rounded-md bg-slate-900/50 border border-slate-700 px-3 py-2 outline-none focus:border-slate-500'
              placeholder='Search by doctor or specialization…'
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div>
            <div className='text-sm text-slate-400 mb-1'>Status</div>
            <select
              className='w-full rounded-md bg-slate-900/50 border border-slate-700 px-3 py-2'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value='all'>All</option>
              <option value='available'>Available</option>
              <option value='booked'>Booked</option>
              <option value='expired'>Expired</option>
            </select>
          </div>
        </div>
      </Card>

      {loading && <Spinner label='Loading availability…' />}
      {err && <Alert kind='error'>{err}</Alert>}

      {!loading && !err && (
        <Card className='p-0 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-sm'>
              <thead className='bg-slate-900/60 border-b border-slate-700'>
                <tr className='text-left'>
                  <th className='px-4 py-3 font-medium text-slate-300'>
                    Doctor
                  </th>
                  <th className='px-4 py-3 font-medium text-slate-300'>
                    Specialization
                  </th>
                  <th className='px-4 py-3 font-medium text-slate-300'>
                    Start
                  </th>
                  <th className='px-4 py-3 font-medium text-slate-300'>End</th>
                  <th className='px-4 py-3 font-medium text-slate-300'>
                    Status
                  </th>
                  <th className='px-4 py-3'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-800'>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-4 py-6 text-center text-slate-400'
                    >
                      No slots match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((slot) => {
                    const status = slot._status;
                    return (
                      <tr
                        key={slot.id}
                        className={`hover:bg-slate-900/40 ${
                          status === 'expired' ? 'opacity-50' : ''
                        }`}
                      >
                        <td className='px-4 py-3'>
                          <div className='font-medium'>{slot.doctor_name}</div>
                          <div className='text-xs text-slate-400'>
                            {slot.doctor_mode}
                          </div>
                        </td>
                        <td className='px-4 py-3'>{slot.specialization}</td>
                        <td className='px-4 py-3'>
                          {fmtDateTime(slot.start_time)}
                        </td>
                        <td className='px-4 py-3'>{fmtTime(slot.end_time)}</td>
                        <td className='px-4 py-3'>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              badgeClass[status] || badgeClass.default
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
