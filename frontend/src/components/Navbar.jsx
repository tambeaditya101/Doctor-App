import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { token, logout } = useContext(AuthContext);
  const nav = useNavigate();
  const loc = useLocation();

  const onLogout = () => {
    logout();
    if (loc.pathname !== '/login') nav('/login');
  };

  return (
    <nav className='sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-slate-800'>
      <div className='max-w-5xl mx-auto px-4 py-3 flex items-center justify-between'>
        <Link to='/discover-doc' className='font-semibold text-slate-100'>
          DocBook
        </Link>
        <div className='flex items-center gap-3'>
          {token && (
            <>
              <Link
                to='/discover-doc'
                className='text-slate-300 hover:text-white'
              >
                Discover
              </Link>
              <Link to='/appointments' className='hover:underline'>
                My Appointments
              </Link>
            </>
          )}
          {!token ? (
            <>
              <Link to='/login' className='text-slate-300 hover:text-white'>
                Login
              </Link>
              <Link to='/register' className='text-slate-300 hover:text-white'>
                Register
              </Link>
            </>
          ) : (
            <Button
              className='bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-900'
              onClick={onLogout}
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
