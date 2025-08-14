// jobs/appointmentsCleanupJob.js
import pool from '../config/db.js';
import { otpStore } from '../utils/otpStore.js';

export function startAppointmentsCleanupJob() {
  setInterval(async () => {
    try {
      // 1) drop expired OTPs from memory
      const now = Date.now();
      for (const [id, rec] of otpStore.entries()) {
        if (now > rec.expiresAt) otpStore.delete(id);
      }

      // 2) delete expired, unconfirmed appointments
      const result = await pool.query(
        `DELETE FROM appointments
          WHERE is_confirmed = FALSE
            AND locked_until IS NOT NULL
            AND locked_until < NOW()`
      );

      if (result.rowCount > 0) {
        console.log(
          `🧹 cleaned ${result.rowCount} expired pending appointments`
        );
      }
    } catch (e) {
      console.error('cleanup job error:', e.message);
    }
  }, 60 * 1000);

  console.log('🕒 appointments cleanup job started.');
}
