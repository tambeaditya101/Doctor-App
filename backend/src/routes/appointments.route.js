import express from 'express';
import {
  bookAppointment,
  confirmAppointment,
} from '../controllers/appointments.controller.js';

const router = express.Router();

router.post('/book', bookAppointment);
router.post('/confirm', confirmAppointment);

export default router;
