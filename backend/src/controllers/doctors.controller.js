import pool from '../config/db.js';
import {
  buildDiscoverDoctorsQuery,
  getAllDoctorsQuery,
} from '../queries/doctors.query.js';
import { errorResponse, successResponse } from '../utils/response.js';

// --- Get all doctors ---
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await pool.query(getAllDoctorsQuery);
    return successResponse(res, 'Doctors fetched successfully', {
      doctors: doctors.rows,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return errorResponse(res, 'Failed to fetch doctors', 500);
  }
};

// --- Discover doctors ---
export const discoverDoctors = async (req, res) => {
  try {
    const { specialization, mode } = req.query;

    const { text, values } = buildDiscoverDoctorsQuery({
      specialization,
      mode,
    });
    const result = await pool.query(text, values);

    return successResponse(res, 'Doctors discovered successfully', {
      doctors: result.rows,
    });
  } catch (error) {
    console.error('Error discovering doctors:', error);
    return errorResponse(res, 'Failed to discover doctors', 500);
  }
};
