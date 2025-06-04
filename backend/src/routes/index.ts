import { Router } from 'express';
import authRoutes from './auth.routes';
import markerRoutes from './marker.routes';
import userRoutes from './users';
import uploadRoutes from './upload';

const router = Router();

router.use('/auth', authRoutes);
router.use('/markers', markerRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);

export default router; 