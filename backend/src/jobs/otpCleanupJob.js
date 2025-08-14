import pool from '../config/db.js';
import { otpStore } from '../utils/otpStore.js';

export function startOtpCleanupJob() {
  setInterval(async () => {
    const now = Date.now();
    for (const [appointmentId, { expiresAt }] of otpStore.entries()) {
      if (now > expiresAt) {
        otpStore.delete(appointmentId);
        await pool.query(
          `UPDATE appointments SET status = 'cancelled' WHERE id = $1 AND status = 'booked'`,
          [appointmentId]
        );
        console.log(`🗑 Released expired slot for appointment ${appointmentId}`);
      }
    }
  }, 60 * 1000);

  console.log('🕒 OTP cleanup job started.');
}
