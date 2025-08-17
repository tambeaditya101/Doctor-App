// queries/appointments.query.js

export const GET_APPOINTMENT_FOR_UPDATE = `
  SELECT id, doctor_id, start_time, end_time, is_booked, user_id, locked_until, is_confirmed
  FROM availability
  WHERE id = $1
  FOR UPDATE
`;

export const GET_PENDING_APPOINTMENT = `
  SELECT 1
  FROM appointments
  WHERE availability_id = $1
    AND is_confirmed = FALSE
    AND locked_until > NOW()
  LIMIT 1
`;

export const INSERT_APPOINTMENT = `
  INSERT INTO appointments
    (user_id, doctor_id, availability_id, status, locked_until, is_confirmed, created_at)
  VALUES
    ($1, $2, $3, NULL, NOW() + INTERVAL '5 minutes', FALSE, NOW())
  RETURNING id, public_id, locked_until
`;

export const UPDATE_APPOINTMENT_CONFIRM = `
  UPDATE appointments
     SET is_confirmed = TRUE,
         locked_until = NULL,
         status = 'booked'
   WHERE id = $1
`;

export const UPDATE_AVAILABILITY_BOOK = `
  UPDATE availability
     SET is_booked = TRUE
   WHERE id = $1
`;

export const UPDATE_AVAILABILITY_FREE = `
  UPDATE availability
     SET is_booked = FALSE
   WHERE id = $1
`;

export const AUTO_COMPLETE_PAST_APPOINTMENTS = `
  UPDATE appointments ap
  SET status = 'completed'
  FROM availability a
  WHERE ap.availability_id = a.id
    AND ap.user_id = $1
    AND ap.status = 'booked'
    AND a.end_time < NOW()
`;

export const GET_USER_APPOINTMENTS = (status) => {
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
  if (status) query += ` AND ap.status = '${status}'`; // safe because parameterized
  query += ` ORDER BY a.start_time ASC`;
  return query;
};

export const GET_APPOINTMENT_CANCEL_LOCK = `
  SELECT id, user_id, availability_id, is_confirmed
  FROM appointments
  WHERE id = $1
  FOR UPDATE
`;

export const UPDATE_APPOINTMENT_CANCEL = `
  UPDATE appointments
     SET status = 'cancelled',
         is_confirmed = FALSE
   WHERE id = $1
`;

export const GET_AVAILABILITY_FOR_RESCHEDULE = `
  SELECT start_time
  FROM availability
  WHERE id = $1
  FOR UPDATE
`;

export const GET_NEW_AVAILABILITY = `
  SELECT id, doctor_id, start_time, end_time, is_booked
  FROM availability
  WHERE id = $1
  FOR UPDATE
`;

export const UPDATE_APPOINTMENT_RESCHEDULE = `
  UPDATE appointments
     SET availability_id = $1, created_at = NOW()
   WHERE id = $2
`;
