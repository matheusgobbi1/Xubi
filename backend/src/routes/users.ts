import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const userController = new UserController();

router.patch('/avatar', authMiddleware, userController.updateAvatar);

export default router; 