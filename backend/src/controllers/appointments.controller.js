// controllers/appointments.controller.js
import crypto from 'crypto';
import pool from '../config/db.js';
import {
  AUTO_COMPLETE_PAST_APPOINTMENTS,
  GET_APPOINTMENT_CANCEL_LOCK,
  GET_APPOINTMENT_FOR_UPDATE,
  GET_AVAILABILITY_FOR_RESCHEDULE,
  GET_NEW_AVAILABILITY,
  GET_PENDING_APPOINTMENT,
  GET_USER_APPOINTMENTS,
  INSERT_APPOINTMENT,
  UPDATE_APPOINTMENT_CANCEL,
  UPDATE_APPOINTMENT_CONFIRM,
  UPDATE_APPOINTMENT_RESCHEDULE,
  UPDATE_AVAILABILITY_BOOK,
  UPDATE_AVAILABILITY_FREE,
} from '../queries/appointments.query.js';
import { otpStore } from '../utils/otpStore.js';
import { errorResponse, successResponse } from '../utils/response.js';

const genOtp = () => crypto.randomInt(100000, 1000000).toString();

export const bookAppointment = async (req, res) => {
  const { availability_id } = req.body;
  const userId = req.user?.id;

  if (!availability_id)
    return errorResponse(res, 'availability_id is required', 400);
  if (!userId) return errorResponse(res, 'Unauthorized', 401);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const availRes = await client.query(GET_APPOINTMENT_FOR_UPDATE, [
      availability_id,
    ]);
    if (availRes.rowCount === 0)
      return errorResponse(res, 'Availability slot not found', 404);

    const avail = availRes.rows[0];
    if (avail.is_booked) return errorResponse(res, 'Slot already booked', 409);

    const pendingRes = await client.query(GET_PENDING_APPOINTMENT, [
      availability_id,
    ]);
    if (pendingRes.rowCount > 0)
      return errorResponse(
        res,
        'Slot is temporarily locked. Try again after 5 minutes.',
        409
      );

    const insertRes = await client.query(INSERT_APPOINTMENT, [
      userId,
      avail.doctor_id,
      availability_id,
    ]);
    const appt = insertRes.rows[0];

    await client.query('COMMIT');

    const otp = genOtp();
    otpStore.set(appt.id, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    return successResponse(
      res,
      'Slot locked for 5 minutes. Confirm with OTP.',
      {
        appointment_id: appt.id,
        public_id: appt.public_id,
        locked_until: appt.locked_until,
        otp, // remove in production
      },
      201
    );
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(res, err.message);
  } finally {
    client.release();
  }
};

/**
 * Confirm appointment with OTP
 */
export const confirmAppointment = async (req, res) => {
  const { appointment_id, otp } = req.body;
  const userId = req.user?.id;

  if (!appointment_id || !otp)
    return errorResponse(res, 'appointment_id and otp are required', 400);
  if (!userId) return errorResponse(res, 'Unauthorized', 401);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apptRes = await client.query(GET_APPOINTMENT_FOR_UPDATE, [
      appointment_id,
    ]);
    if (apptRes.rowCount === 0)
      return errorResponse(res, 'Appointment not found', 404);

    const appt = apptRes.rows[0];

    if (appt.user_id !== userId)
      return errorResponse(res, 'You cannot confirm this appointment', 403);
    if (appt.is_confirmed)
      return errorResponse(res, 'Appointment already confirmed', 400);
    if (!appt.locked_until || new Date(appt.locked_until) < new Date())
      return errorResponse(res, 'Lock expired, please book again', 400);

    const record = otpStore.get(appt.id);
    if (!record) return errorResponse(res, 'OTP expired or not found', 400);
    if (Date.now() > record.expiresAt) {
      otpStore.delete(appt.id);
      return errorResponse(res, 'OTP expired', 400);
    }
    if (record.otp !== otp) return errorResponse(res, 'Invalid OTP', 400);

    await client.query(UPDATE_APPOINTMENT_CONFIRM, [appt.id]);
    await client.query(UPDATE_AVAILABILITY_BOOK, [appt.availability_id]);

    await client.query('COMMIT');
    otpStore.delete(appt.id);

    return successResponse(res, 'Appointment confirmed');
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(res, err.message);
  } finally {
    client.release();
  }
};

/**
 * Get user appointments (auto-complete past)
 */
export const getUserAppointments = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;
    if (!userId) return errorResponse(res, 'Unauthorized', 401);

    await client.query('BEGIN');
    await client.query(AUTO_COMPLETE_PAST_APPOINTMENTS, [userId]);

    const { status } = req.query;
    const result = await client.query(GET_USER_APPOINTMENTS(status), [userId]);

    await client.query('COMMIT');

    return successResponse(res, 'Appointments fetched', result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(res, err.message);
  } finally {
    client.release();
  }
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (req, res) => {
  const appointmentId = Number(req.params.id);
  const userId = req.user?.id;
  if (!userId) return errorResponse(res, 'Unauthorized', 401);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apptRes = await client.query(GET_APPOINTMENT_CANCEL_LOCK, [
      appointmentId,
    ]);
    if (apptRes.rowCount === 0)
      return errorResponse(res, 'Appointment not found', 404);

    const appt = apptRes.rows[0];
    if (appt.user_id !== userId) return errorResponse(res, 'Forbidden', 403);

    const canCancelRes = await client.query(
      `SELECT (start_time > NOW() + INTERVAL '24 hours') AS can_cancel
       FROM availability WHERE id = $1`,
      [appt.availability_id]
    );
    if (!canCancelRes.rows[0].can_cancel)
      return errorResponse(
        res,
        'Cancellations allowed only >24 hours before appointment',
        400
      );

    await client.query(UPDATE_APPOINTMENT_CANCEL, [appointmentId]);
    await client.query(UPDATE_AVAILABILITY_FREE, [appt.availability_id]);

    await client.query('COMMIT');
    return successResponse(res, 'Appointment cancelled');
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(res, err.message);
  } finally {
    client.release();
  }
};

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = async (req, res) => {
  const appointmentId = Number(req.params.id);
  const { new_availability_id } = req.body;
  const userId = req.user?.id;
  if (!userId) return errorResponse(res, 'Unauthorized', 401);
  if (!new_availability_id)
    return errorResponse(res, 'new_availability_id is required', 400);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const apptRes = await client.query(GET_APPOINTMENT_FOR_UPDATE, [
      appointmentId,
    ]);
    if (apptRes.rowCount === 0)
      return errorResponse(res, 'Appointment not found', 404);

    const appt = apptRes.rows[0];
    if (appt.user_id !== userId) return errorResponse(res, 'Forbidden', 403);
    if (!appt.is_confirmed)
      return errorResponse(
        res,
        'Only confirmed appointments can be rescheduled',
        400
      );

    const originalAvailRes = await client.query(
      GET_AVAILABILITY_FOR_RESCHEDULE,
      [appt.availability_id]
    );
    if (originalAvailRes.rowCount === 0)
      return errorResponse(res, 'Original availability not found', 404);

    if (
      new Date(originalAvailRes.rows[0].start_time) <
      new Date(Date.now() + 24 * 3600 * 1000)
    )
      return errorResponse(
        res,
        'Rescheduling allowed only >24 hours before appointment',
        400
      );

    const newAvailRes = await client.query(GET_NEW_AVAILABILITY, [
      new_availability_id,
    ]);
    if (newAvailRes.rowCount === 0)
      return errorResponse(res, 'New availability not found', 404);

    const newAvail = newAvailRes.rows[0];
    if (newAvail.doctor_id !== appt.doctor_id)
      return errorResponse(res, 'Reschedule must be to the same doctor', 400);
    if (newAvail.is_booked)
      return errorResponse(res, 'Target slot is already booked', 409);

    const pendingRes = await client.query(GET_PENDING_APPOINTMENT, [
      newAvail.id,
    ]);
    if (pendingRes.rowCount > 0)
      return errorResponse(res, 'Target slot is temporarily locked', 409);

    await client.query(UPDATE_AVAILABILITY_FREE, [appt.availability_id]);
    await client.query(UPDATE_AVAILABILITY_BOOK, [newAvail.id]);
    await client.query(UPDATE_APPOINTMENT_RESCHEDULE, [
      newAvail.id,
      appointmentId,
    ]);

    await client.query('COMMIT');
    return successResponse(res, 'Appointment rescheduled');
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(res, err.message);
  } finally {
    client.release();
  }
};
