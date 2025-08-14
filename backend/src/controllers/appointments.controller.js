// import crypto from 'crypto';
// import pool from '../config/db.js';
// import { otpStore } from '../utils/otpStore.js';

// // Step 1: Book Slot & Generate OTP
// export const bookSlot = async (req, res) => {
//   try {
//     const { doctorId, availabilityId } = req.body;
//     const { id } = req.user;

//     // Lock slot (status = 'booked')
//     const appointment = await pool.query(
//       `INSERT INTO appointments (user_id, doctor_id, availability_id)
//        VALUES ($1, $2, $3) RETURNING id`,
//       [id, doctorId, availabilityId]
//     );

//     const appointmentId = appointment.rows[0].id;

//     // Generate OTP
//     const otp = crypto.randomInt(100000, 999999).toString();

//     // Save OTP in memory with expiry
//     otpStore.set(appointmentId, {
//       otp,
//       expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
//     });

//     console.log(`Generated OTP for appointment ${appointmentId}: ${otp}`);

//     res.status(200).json({
//       message: 'Slot locked for 5 minutes. Please confirm with OTP.',
//       appointmentId,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Step 2: Confirm Booking
// export const confirmBooking = async (req, res) => {
//   try {
//     const { appointmentId, otp } = req.body;

//     const record = otpStore.get(appointmentId);
//     if (!record) {
//       return res
//         .status(400)
//         .json({ error: 'OTP expired or booking not found' });
//     }

//     if (Date.now() > record.expiresAt) {
//       otpStore.delete(appointmentId);
//       return res.status(400).json({ error: 'OTP expired' });
//     }

//     if (record.otp !== otp) {
//       return res.status(400).json({ error: 'Invalid OTP' });
//     }

//     // Mark confirmed in DB
//     await pool.query(
//       `UPDATE appointments SET status = 'booked' WHERE id = $1`,
//       [appointmentId]
//     );

//     // Remove OTP from store
//     otpStore.delete(appointmentId);

//     res.status(200).json({ message: 'Booking confirmed' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// controllers/appointments.controller.js
import crypto from 'crypto';
import pool from '../config/db.js';
import { otpStore } from '../utils/otpStore.js';

// generate a 6-digit OTP
const genOtp = () => crypto.randomInt(100000, 1000000).toString();

/**
 * POST /api/appointments/book
 * body: { availability_id: number }
 * auth: required (req.user.id)
 *
 * flow:
 *  - lock availability row (FOR UPDATE)
 *  - ensure not booked & not currently locked by someone else
 *  - insert appointments row with status = NULL, is_confirmed = false, locked_until = now()+5m
 *  - generate OTP in-memory
 */
export const bookAppointment = async (req, res) => {
  const { availability_id } = req.body;
  const userId = req.user?.id;

  if (!availability_id) {
    return res.status(400).json({ error: 'availability_id is required' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) lock the availability row to serialize concurrent attempts
    const availRes = await client.query(
      `SELECT id, doctor_id, start_time, end_time, is_booked
         FROM availability
        WHERE id = $1
        FOR UPDATE`,
      [availability_id]
    );
    if (availRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Availability slot not found' });
    }
    const avail = availRes.rows[0];

    // 2) hard-booked already?
    if (avail.is_booked) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Slot already booked' });
    }

    // 3) pending lock by someone else?
    const pendingRes = await client.query(
      `SELECT 1
         FROM appointments
        WHERE availability_id = $1
          AND is_confirmed = FALSE
          AND locked_until > NOW()
        LIMIT 1`,
      [availability_id]
    );
    if (pendingRes.rowCount > 0) {
      await client.query('ROLLBACK');
      return res
        .status(409)
        .json({
          error: 'Slot is temporarily locked. Try again in a few minutes.',
        });
    }

    // 4) create a pending appointment (status NULL is allowed by your CHECK)
    const insertRes = await client.query(
      `INSERT INTO appointments
         (user_id, doctor_id, availability_id, status, locked_until, is_confirmed, created_at)
       VALUES
         ($1,     $2,        $3,              NULL,   NOW() + INTERVAL '5 minutes', FALSE, NOW())
       RETURNING id, public_id, locked_until`,
      [userId, avail.doctor_id, availability_id]
    );
    const appt = insertRes.rows[0];

    await client.query('COMMIT');

    // 5) generate + store OTP in-memory (PoC)
    const otp = genOtp();
    otpStore.set(appt.id, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    // For PoC we return OTP; in production, send via SMS/Email and DO NOT return it
    return res.status(201).json({
      message: 'Slot locked for 5 minutes. Confirm with OTP.',
      appointment_id: appt.id,
      public_id: appt.public_id,
      locked_until: appt.locked_until,
      otp, // remove in production
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

/**
 * POST /api/appointments/confirm
 * body: { appointment_id: number, otp: string }
 * auth: required
 *
 * flow:
 *  - fetch appointment FOR UPDATE
 *  - validate owner, lock not expired
 *  - check in-memory OTP (exists, not expired, matches)
 *  - mark appointment booked; set availability.is_booked = true
 */
export const confirmAppointment = async (req, res) => {
  const { appointment_id, otp } = req.body;
  const userId = req.user?.id;

  if (!appointment_id || !otp) {
    return res
      .status(400)
      .json({ error: 'appointment_id and otp are required' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apptRes = await client.query(
      `SELECT id, user_id, availability_id, is_confirmed, locked_until
         FROM appointments
        WHERE id = $1
        FOR UPDATE`,
      [appointment_id]
    );
    if (apptRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appt = apptRes.rows[0];

    if (appt.user_id !== userId) {
      await client.query('ROLLBACK');
      return res
        .status(403)
        .json({ error: 'You cannot confirm this appointment' });
    }
    if (appt.is_confirmed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Appointment already confirmed' });
    }
    if (!appt.locked_until || new Date(appt.locked_until) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Lock expired, please book again' });
    }

    // OTP check (in-memory)
    const record = otpStore.get(appt.id);
    if (!record) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'OTP expired or not found' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(appt.id);
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'OTP expired' });
    }
    if (record.otp !== otp) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // mark appointment booked (status must be one of your CHECK-allowed values)
    await client.query(
      `UPDATE appointments
          SET is_confirmed = TRUE,
              locked_until = NULL,
              status = 'booked'
        WHERE id = $1`,
      [appt.id]
    );

    // hard book the availability slot
    await client.query(
      `UPDATE availability
          SET is_booked = TRUE
        WHERE id = $1`,
      [appt.availability_id]
    );

    await client.query('COMMIT');

    // cleanup in-memory OTP
    otpStore.delete(appt.id);

    return res.json({ message: 'Appointment confirmed' });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
