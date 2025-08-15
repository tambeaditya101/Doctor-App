// jobs/appointmentsCleanupJob.js
import pool from '../config/db.js';
import { otpStore } from '../utils/otpStore.js';

export function startAppointmentsCleanupJob({ intervalMs = 60_000 } = {}) {
  // run every minute by default
  setInterval(async () => {
    try {
      // 1) clear in-memory OTPs that are expired
      const now = Date.now();
      for (const [id, rec] of otpStore.entries()) {
        if (rec.expiresAt <= now) otpStore.delete(id);
      }

      // 2) delete expired, unconfirmed appointment holds in DB
      const result = await pool.query(
        `DELETE FROM appointments
          WHERE is_confirmed = FALSE
            AND locked_until IS NOT NULL
            AND locked_until < NOW()
        RETURNING id`
      );

      if (result.rowCount > 0) {
        // also remove any leftover OTPs for deleted appointments
        for (const row of result.rows) {
          otpStore.delete(row.id);
        }
        console.log(`🧹 Cleaned ${result.rowCount} expired appointment(s)`);
      }
    } catch (err) {
      console.error('appointments cleanup error', err.message || err);
    }
  }, intervalMs);

  console.log('🕒 Appointments cleanup job started');
}
