import pool from '../config/db.js';
import { getAllSpecializationsQuery } from '../queries/specializations.query.js';
import { errorResponse, successResponse } from '../utils/response.js';

export const getAllSpecializations = async (req, res) => {
  try {
    const result = await pool.query(getAllSpecializationsQuery);
    return successResponse(res, 'Specializations fetched successfully', {
      specializations: result.rows,
    });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return errorResponse(res, 'Failed to fetch specializations', 500);
  }
};
