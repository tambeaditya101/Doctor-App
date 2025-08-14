import express from 'express';
import { getAllSpecializations } from '../controllers/specializations.controller.js';

const router = express.Router();

router.get('/', getAllSpecializations);

export default router;
