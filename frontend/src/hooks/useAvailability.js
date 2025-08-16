// src/hooks/useAvailability.js
import { useCallback, useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { computeStatus } from '../utils/availability';

/**
 * useAvailability
 * - Fetches /availability/all
 * - Normalizes rows and adds `_status` (available | booked | expired)
 * - Returns { rows, loading, error, refresh }
 *
 * options:
 *  - refreshInterval: (ms) optional polling interval (null = no poll)
 */
export function useAvailability({ refreshInterval = null } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/availability/all');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      // normalize and attach computed status
      const normalized = data.map((r) => ({
        ...r,
        // keep original fields, but attach `_status` for consumer convenience
        _status: computeStatus(r),
      }));

      setRows(normalized);
    } catch (err) {
      // safe extraction of server message
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load availability';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial + optional polling
  useEffect(() => {
    fetchAvailability();
    if (!refreshInterval) return undefined;

    const t = setInterval(fetchAvailability, refreshInterval);
    return () => clearInterval(t);
  }, [fetchAvailability, refreshInterval]);

  return {
    rows,
    loading,
    error,
    refresh: fetchAvailability,
  };
}
