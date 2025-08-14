import dotenv from 'dotenv';
import express from 'express';
import { authMiddleware } from './middleware/auth.middleware.js';
import appointmentsRoute from './routes/appointments.route.js';
import authRoute from './routes/auth.route.js';
import availabilityRoute from './routes/availability.route.js';
import doctorsRoute from './routes/doctors.route.js';
import specializationsRoute from './routes/specializations.route.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/auth', authRoute);
app.use(authMiddleware);
app.use('/api/specializations', specializationsRoute);
app.use('/api/doctors', doctorsRoute);
app.use('/api/availability', availabilityRoute);
app.use('/api/appointments', appointmentsRoute);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running at - http://localhost:${port}/
`);
});
