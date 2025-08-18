import { memo, useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from './Button';

// Extract NavLink outside so it isn't recreated on every render
const NavItem = memo(({ to, children, onClick }) => {
  const loc = useLocation();
  const active = loc.pathname === to;

  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${
          active
            ? 'bg-slate-800 text-white'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
});

export default function Navbar() {
  const { token, logout } = useContext(AuthContext);
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = () => {
    logout();
    nav('/login', { replace: true });
  };

  // Links config
  const authedLinks = [
    { to: '/discover-doc', label: 'Discover' },
    { to: '/doc-availability', label: 'Availability Log' },
    { to: '/appointments', label: 'Appointments' },
  ];

  const publicLinks = [
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Register' },
  ];

  return (
    <nav
      role='navigation'
      className='sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-slate-800'
    >
      <div className='max-w-5xl mx-auto px-4'>
        <div className='flex h-14 items-center justify-between'>
          {/* Brand */}
          <Link
            to='/discover-doc'
            className='text-lg font-semibold text-white tracking-wide'
          >
            DocBook
          </Link>

          {/* Desktop Links */}
          <div className='hidden md:flex items-center gap-2'>
            {(token ? authedLinks : publicLinks).map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavItem>
            ))}
            {token && (
              <Button
                className='ml-2 border border-slate-700 text-slate-200 bg-transparent hover:bg-slate-800/70'
                onClick={onLogout}
              >
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            aria-label='Toggle menu'
            className='md:hidden p-2 text-slate-300 hover:text-white'
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className='md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm px-2 pb-3 space-y-1'>
          {(token ? authedLinks : publicLinks).map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavItem>
          ))}
          {token && (
            <Button
              className='w-full border border-slate-700 text-slate-200 bg-transparent hover:bg-slate-800/70'
              onClick={onLogout}
            >
              Logout
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
