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
  SELECT * FROM availability
  ORDER BY doctor_id;
`;
