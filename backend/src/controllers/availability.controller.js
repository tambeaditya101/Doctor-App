// src/controllers/availability.controller.js
import pool from '../config/db.js';
import {
  GET_ALL_AVAILABILITY,
  GET_DOCTOR_AVAILABILITY,
} from '../queries/availability.query.js';

// Get all availability
export const getAllAvailabilities = async (req, res) => {
  try {
    const result = await pool.query(GET_ALL_AVAILABILITY);
    res.json({ msg: 'success', data: result.rows });
  } catch (error) {
    console.error('Error fetching all availability:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get availability for a specific doctor
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await pool.query(GET_DOCTOR_AVAILABILITY, [doctorId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'No availability found for this doctor' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
