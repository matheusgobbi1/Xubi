import { Router } from 'express';
import authRoutes from './auth.routes';
import markerRoutes from './marker.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/markers', markerRoutes);

export default router; 