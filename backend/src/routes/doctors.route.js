import express from 'express';
import {
  discoverDoctors,
  getAllDoctors,
} from '../controllers/doctors.controller.js';

const router = express.Router();

router.get('/', getAllDoctors);
router.get('/discover', discoverDoctors);

export default router;
