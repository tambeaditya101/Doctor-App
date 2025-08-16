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
      return res.status(409).json({
        error: 'Slot is temporarily locked. Try again after 5 minutes.',
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

export const getUserAppointments = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await client.query('BEGIN');

    // ✅ 1. Auto-mark past "booked" appointments as completed
    await client.query(
      `UPDATE appointments ap
       SET status = 'completed'
       FROM availability a
       WHERE ap.availability_id = a.id
         AND ap.user_id = $1
         AND ap.status = 'booked'
         AND a.end_time < NOW()`,
      [userId]
    );

    // ✅ 2. Now fetch updated list
    const { status } = req.query; // optional

    let query = `
      SELECT
        ap.id,
        ap.public_id,
        ap.status,
        ap.is_confirmed,
        ap.created_at,
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.mode AS doctor_mode,
        s.name AS specialization,
        a.id AS availability_id,
        a.start_time,
        a.end_time
      FROM appointments ap
      JOIN doctors d ON ap.doctor_id = d.id
      JOIN specializations s ON d.specialization_id = s.id
      JOIN availability a ON ap.availability_id = a.id
      WHERE ap.user_id = $1
    `;

    const params = [userId];
    if (status) {
      params.push(status);
      query += ` AND ap.status = $${params.length}`;
    }

    query += ` ORDER BY a.start_time ASC`;

    const result = await client.query(query, params);

    await client.query('COMMIT');

    res.json({ msg: 'success', data: result.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const cancelAppointment = async (req, res) => {
  const appointmentId = Number(req.params.id);
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock appointment row
    const apptRes = await client.query(
      `SELECT id, user_id, availability_id, is_confirmed
         FROM appointments
        WHERE id = $1
        FOR UPDATE`,
      [appointmentId]
    );
    if (apptRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appt = apptRes.rows[0];
    if (appt.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get availability start_time (lock it)
    const availRes = await client.query(
      `SELECT id, start_time, is_booked FROM availability WHERE id = $1 FOR UPDATE`,
      [appt.availability_id]
    );
    if (availRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Availability not found' });
    }
    const avail = availRes.rows[0];

    // allow cancellation only if >24h before start_time
    const diffQuery = await client.query(
      //for testing.. SELECT (a.start_time > NOW() + INTERVAL '1 minute') AS can_cancel

      `SELECT (a.start_time > NOW() + INTERVAL '24 hours') AS can_cancel
         FROM availability a WHERE a.id = $1`,
      [avail.id]
    );
    if (!diffQuery.rows[0].can_cancel) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Cancellations allowed only >24 hours before appointment',
      });
    }

    // update appointment status and free availability
    await client.query(
      `UPDATE appointments SET status = 'cancelled', is_confirmed = FALSE WHERE id = $1`,
      [appointmentId]
    );

    await client.query(
      `UPDATE availability SET is_booked = FALSE WHERE id = $1`,
      [avail.id]
    );

    await client.query('COMMIT');

    // cleanup in-memory OTP if present
    // note: otpStore lives in process memory
    // otpStore.delete(appointmentId); // if you want

    return res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const rescheduleAppointment = async (req, res) => {
  const appointmentId = Number(req.params.id);
  const { new_availability_id } = req.body;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!new_availability_id)
    return res.status(400).json({ error: 'new_availability_id is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) lock appointment
    const apptRes = await client.query(
      `SELECT id, user_id, doctor_id, availability_id, is_confirmed
         FROM appointments
        WHERE id = $1
        FOR UPDATE`,
      [appointmentId]
    );
    if (apptRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const appt = apptRes.rows[0];
    if (appt.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!appt.is_confirmed) {
      await client.query('ROLLBACK');
      return res
        .status(400)
        .json({ error: 'Only confirmed appointments can be rescheduled' });
    }

    // Ensure original appointment is >24h from now
    const originalAvail = await client.query(
      `SELECT start_time FROM availability WHERE id = $1 FOR UPDATE`,
      [appt.availability_id]
    );
    if (originalAvail.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Original availability not found' });
    }
    if (
      !(
        new Date(originalAvail.rows[0].start_time) >
        new Date(Date.now() + 24 * 3600 * 1000)
      )
    ) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Rescheduling allowed only >24 hours before appointment',
      });
    }

    // 2) lock new availability
    // To avoid deadlocks, make sure to lock smaller id first (optional), but we'll just lock both
    const newAvailRes = await client.query(
      `SELECT id, doctor_id, start_time, end_time, is_booked FROM availability WHERE id = $1 FOR UPDATE`,
      [new_availability_id]
    );
    if (newAvailRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'New availability not found' });
    }
    const newAvail = newAvailRes.rows[0];

    // Ensure it belongs to same doctor (business rule), optional — require same doctor to reschedule
    if (newAvail.doctor_id !== appt.doctor_id) {
      await client.query('ROLLBACK');
      return res
        .status(400)
        .json({ error: 'Reschedule must be to the same doctor' });
    }

    // Check new slot is free (not booked and not locked)
    if (newAvail.is_booked) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Target slot is already booked' });
    }

    const pendingRes = await client.query(
      `SELECT 1 FROM appointments WHERE availability_id = $1 AND is_confirmed = FALSE AND locked_until > NOW() LIMIT 1`,
      [newAvail.id]
    );
    if (pendingRes.rowCount > 0) {
      await client.query('ROLLBACK');
      return res
        .status(409)
        .json({ error: 'Target slot is temporarily locked' });
    }

    // 3) perform swap: free old availability, mark new availability booked, update appointment
    await client.query(
      `UPDATE availability SET is_booked = FALSE WHERE id = $1`,
      [appt.availability_id]
    );

    await client.query(
      `UPDATE availability SET is_booked = TRUE WHERE id = $1`,
      [newAvail.id]
    );

    await client.query(
      `UPDATE appointments
         SET availability_id = $1, created_at = NOW()
       WHERE id = $2`,
      [newAvail.id, appointmentId]
    );

    await client.query('COMMIT');
    return res.json({ message: 'Appointment rescheduled' });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
