CREATE INDEX IF NOT EXISTS idx_appointments_availability_confirmed
  ON public.appointments (availability_id, is_confirmed);