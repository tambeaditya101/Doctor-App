export const getAllDoctorsQuery = `
  SELECT d.id, d.name, d.mode, s.name AS specialization
  FROM doctors d
  JOIN specializations s ON d.specialization_id = s.id
  ORDER BY d.name ASC;
`;

// helper to build dynamic discover query
export const buildDiscoverDoctorsQuery = ({ specialization, mode }) => {
  let text = `
    SELECT
      d.id,
      d.name,
      d.mode,
      s.name AS specialization,
      a.id AS availability_id,
      a.start_time AS available_from,
      a.end_time AS available_till
    FROM doctors d
    JOIN specializations s ON d.specialization_id = s.id
    JOIN availability a ON d.id = a.doctor_id
    WHERE a.is_booked = FALSE
      AND a.start_time > NOW()
      AND NOT EXISTS (
        SELECT 1 FROM appointments ap
        WHERE ap.availability_id = a.id
          AND ap.is_confirmed = FALSE
          AND ap.locked_until > NOW()
      )
  `;

  const values = [];
  let idx = 1;

  if (specialization) {
    text += ` AND s.name ILIKE $${idx++}`;
    values.push(`%${specialization}%`);
  }

  if (mode) {
    text += ` AND d.mode = $${idx++}`;
    values.push(mode);
  }

  text += ` ORDER BY a.start_time ASC`;

  return { text, values };
};
