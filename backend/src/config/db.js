import dotenv from 'dotenv';
import pkg from 'pg';
import { startAppointmentsCleanupJob } from '../jobs/appointmentsCleanupJob.js';
import { startOtpCleanupJob } from '../jobs/otpCleanupJob.js';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

let jobsStarted = false;
pool.on('connect', () => {
  if (!jobsStarted) {
    console.log('✅ Connected to PostgreSQL');
    startOtpCleanupJob();
    startAppointmentsCleanupJob();
    jobsStarted = true;
  }
});

export default pool;
