import express from 'express';
import {
  getAllAvailabilities,
  getDoctorAvailability,
} from '../controllers/availability.controller.js';

const router = express.Router();

// Get all doctors' availability
router.get('/', getAllAvailabilities);

// Get specific doctor's availability
router.get('/:doctorId', getDoctorAvailability);

export default router;
