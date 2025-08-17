export const GET_DOCTOR_AVAILABILITY = `
      SELECT 
        id, 
        doctor_id,
        start_time, 
        end_time 
      FROM availability
      WHERE doctor_id = $1
    `;

export const GET_ALL_AVAILABILITY = `
  SELECT
        a.id,
        a.start_time,
        a.end_time,
        a.is_booked,
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.mode AS doctor_mode,
        s.name AS specialization,
        CASE
          WHEN a.start_time < NOW() THEN 'expired'
          WHEN a.is_booked = TRUE THEN 'booked'
          ELSE 'available'
        END AS status
      FROM availability a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN specializations s ON d.specialization_id = s.id
      ORDER BY a.start_time ASC
`;
