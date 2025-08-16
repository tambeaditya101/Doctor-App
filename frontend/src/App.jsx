import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Protected from './components/Protected';
import { protectedRoutes, publicRoutes } from './routes';

export default function App() {
  return (
    <div className='min-h-screen bg-slate-600 text-slate-100'>
      <Navbar />
      <main className='max-w-5xl mx-auto px-4 py-6'>
        <Routes>
          {protectedRoutes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <Protected>
                  <Component />
                </Protected>
              }
            />
          ))}
          {publicRoutes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        </Routes>
      </main>
    </div>
  );
}
