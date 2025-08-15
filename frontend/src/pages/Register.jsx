import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const { register, loading } = useContext(AuthContext);
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setOk('');
    try {
      await register(form);
      setOk('Registered! Please login.');
      setTimeout(() => nav('/login'), 800);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className='max-w-md mx-auto'>
      <Card>
        <h1 className='text-xl font-semibold mb-4'>Create account</h1>
        <form className='space-y-4' onSubmit={onSubmit}>
          <Input
            label='Name'
            name='name'
            placeholder='Your name'
            value={form.name}
            onChange={onChange}
          />
          <Input
            label='Email'
            name='email'
            placeholder='you@example.com'
            value={form.email}
            onChange={onChange}
          />
          <Input
            label='Phone'
            name='phone'
            placeholder='Your phone'
            value={form.phone}
            onChange={onChange}
          />
          <Input
            label='Password'
            type='password'
            name='password'
            placeholder='••••••••'
            value={form.password}
            onChange={onChange}
          />
          {err && <Alert kind='error'>{err}</Alert>}
          {ok && <Alert kind='success'>{ok}</Alert>}
          <Button className='w-full' disabled={loading}>
            {loading ? <Spinner label='Creating…' /> : 'Register'}
          </Button>
        </form>
        <div className='text-sm text-slate-400 mt-3'>
          Already have an account?{' '}
          <Link to='/login' className='text-blue-400 hover:text-blue-300'>
            Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
