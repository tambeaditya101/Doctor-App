import { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthContext } from './context/AuthContext';
import BookAppointment from './pages/BookAppointment';
import Discover from './pages/Discover';
import Login from './pages/Login';
import Register from './pages/Register';

function Protected({ children }) {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to='/login' replace />;
  return children;
}

export default function App() {
  return (
    <div className='min-h-screen bg-slate-600 text-slate-100'>
      <Navbar />
      <main className='max-w-5xl mx-auto px-4 py-6'>
        <Routes>
          <Route
            path='/'
            element={
              <Protected>
                <Discover />
              </Protected>
            }
          />
          <Route
            path='/book'
            element={
              <Protected>
                <BookAppointment />
              </Protected>
            }
          />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}
