import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Spinner from '../components/Spinner';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { login, busy } = useContext(AuthContext);
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await login(f.email, f.password);
      localStorage.setItem('user', JSON.stringify(res?.data?.user));
      nav('/discover-doc');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className='max-w-md mx-auto'>
      <Card>
        <h1 className='text-xl font-semibold mb-4'>Sign in</h1>
        <form className='space-y-4' onSubmit={onSubmit}>
          <Input
            label='Email'
            placeholder='you@example.com'
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
          <Input
            label='Password'
            type='password'
            placeholder='••••••••'
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
          {err && <Alert kind='error'>{err}</Alert>}
          <Button className='w-full' disabled={busy}>
            {busy ? <Spinner label='Signing in…' /> : 'Sign in'}
          </Button>
        </form>
        <div className='text-sm text-slate-400 mt-3'>
          New here?{' '}
          <Link to='/register' className='text-blue-400 hover:text-blue-300'>
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
}
