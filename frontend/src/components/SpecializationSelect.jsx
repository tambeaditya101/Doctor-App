import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import Select from '../components/Select';

export default function SpecializationSelect({ value, onChange }) {
  const [specializations, setSpecializations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/specializations'); // your backend endpoint
        setSpecializations(res.data.data || []);
      } catch (error) {
        console.error('Error fetching specializations', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Select
      label='Specialization'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value=''>Any</option>
      {specializations.map((spec) => (
        <option key={spec.id} value={spec.name}>
          {spec.name}
        </option>
      ))}
    </Select>
  );
}
