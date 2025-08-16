// routes.js
import AppointmentsPage from './pages/AppointmentsPage';
import BookAppointment from './pages/BookAppointment';
import Discover from './pages/Discover';
import DoctorsAvailability from './pages/DoctorsAvailability';
import Login from './pages/Login';
import Register from './pages/Register';

export const protectedRoutes = [
  { path: '/discover-doc', component: Discover },
  { path: '/book', component: BookAppointment },
  { path: '/doc-availability', component: DoctorsAvailability },
  { path: '/appointments', component: AppointmentsPage },
];

export const publicRoutes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
];
