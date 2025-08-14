export const getAllDoctorsQuery = `
      SELECT 
        d.public_id, 
        d.name, 
        s.name AS specialization
      FROM doctors d
      JOIN specializations s ON d.specialization_id = s.id
      ORDER BY d.id
    `;
