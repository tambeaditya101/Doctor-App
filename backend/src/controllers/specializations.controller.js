import pool from '../config/db.js';
import { getAllSpecializationsQuery } from '../queries/specializations.query.js';

export const getAllSpecializations = async (req, res) => {
  console.log('adiii');
  try {
    const specializations = await pool.query(getAllSpecializationsQuery);
    res.status(200).json({ msg: 'success', data: specializations.rows });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
