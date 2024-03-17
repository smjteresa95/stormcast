import express from 'express';
import weatherController from '../controllers/weatherController.js';

const { saveWeatherData } = weatherController;

const router = express.Router();
router.post('/saveWeatherData/:today', saveWeatherData);

export default router;