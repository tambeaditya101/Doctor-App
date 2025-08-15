import pool from '../config/db.js';
import { getAllDoctorsQuery } from '../queries/doctors.query.js';

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await pool.query(getAllDoctorsQuery);
    console.log(doctors.rows, 'adiii');
    res.status(200).json({ msg: 'success', data: doctors.rows });
  } catch (error) {
    console.log('error');
    res.status(500).json({ message: error.message });
  }
};

export const discoverDoctors = async (req, res) => {
  try {
    const { specialization, mode } = req.query;

    let query = `
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
  WHERE a.is_booked = false
`;

    const params = [];
    let paramIndex = 1;

    if (specialization) {
      query += ` AND s.name ILIKE $${paramIndex++}`;
      params.push(`%${specialization}%`);
    }

    if (mode) {
      query += ` AND d.mode = $${paramIndex++}`;
      params.push(mode);
    }

    query += ` ORDER BY a.start_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// export const discoverDoctors = async (req, res) => {
//   try {
//     const { specialization, mode } = req.query;

//     let query = `
//       SELECT d.id, d.name, d.mode, s.name AS specialization, a.start_time as available_from, a.end_time as available_till
//       FROM doctors d
//       JOIN specializations s ON d.specialization_id = s.id
//       JOIN availability a ON d.id = a.doctor_id

//     `;
//     const params = [];
//     let paramIndex = 1;

//     if (specialization) {
//       query += ` AND s.name ILIKE $${paramIndex++}`;
//       params.push(`%${specialization}%`);
//     }

//     if (mode) {
//       query += ` AND d.mode = $${paramIndex++}`;
//       params.push(mode);
//     }

//     query += ` ORDER BY a.start_time ASC`;

//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
