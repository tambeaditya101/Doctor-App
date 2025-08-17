import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export function useDiscover() {
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

  const load = async (appliedFilters = filters) => {
    setLoading(true);
    setErr('');
    try {
      const q = new URLSearchParams(
        Object.entries(appliedFilters).filter(([_, v]) => v)
      );
      const res = await api.get(`/doctors/discover?${q.toString()}`);

      // ✅ expect consistent backend response
      if (res.data.success) {
        setRows(res.data.data?.doctors || []);
      } else {
        setErr(res.data.message || 'Failed to load doctors');
        setRows([]);
      }
    } catch (e) {
      console.error('discover error', e);
      setErr('Failed to load doctors');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('doctorFilters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { filters, setFilters, rows, loading, err, load };
}
