-- remove default 'booked' so inserts don’t auto-book

ALTER TABLE appointments
  ALTER COLUMN status DROP DEFAULT;