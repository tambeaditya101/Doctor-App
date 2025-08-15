import express from 'express';
import {
  bookAppointment,
  cancelAppointment,
  confirmAppointment,
  getUserAppointments,
  rescheduleAppointment,
} from '../controllers/appointments.controller.js';

const router = express.Router();

router.post('/book', bookAppointment);
router.post('/confirm', confirmAppointment);

// protected endpoints (auth middleware applied globally in server)
router.get('/', getUserAppointments);
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/reschedule', rescheduleAppointment);

export default router;
