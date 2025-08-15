CREATE INDEX IF NOT EXISTS idx_availability_doctor_start ON availability (doctor_id, start_time);
CREATE INDEX IF NOT EXISTS idx_availability_is_booked ON availability (is_booked);
CREATE INDEX IF NOT EXISTS idx_appointments_locked_until ON appointments (locked_until);