// src/controllers/availability.controller.js
import pool from '../config/db.js';
import {
  GET_ALL_AVAILABILITY,
  GET_DOCTOR_AVAILABILITY,
} from '../queries/availability.query.js';
import { errorResponse, successResponse } from '../utils/response.js';

// Get all availability
export const getAllAvailabilities = async (req, res) => {
  try {
    const result = await pool.query(GET_ALL_AVAILABILITY);
    return successResponse(res, 'Availabilities fetched successfully', {
      availabilities: result.rows,
    });
  } catch (error) {
    console.error('Error fetching all availability:', error);
    return errorResponse(res, 'Failed to fetch availabilities', 500);
  }
};

// Get availability for a specific doctor
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await pool.query(GET_DOCTOR_AVAILABILITY, [doctorId]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'No availability found for this doctor', 404);
    }

    return successResponse(res, 'Doctor availability fetched successfully', {
      availability: result.rows,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return errorResponse(res, 'Failed to fetch doctor availability', 500);
  }
};
