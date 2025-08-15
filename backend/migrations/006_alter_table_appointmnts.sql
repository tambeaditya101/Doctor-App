-- 1) Make appointments.status allow NULL (so pending NULL is valid)
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;


ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
CHECK (
  status IS NULL OR status = ANY (ARRAY['booked','completed','cancelled'])
);