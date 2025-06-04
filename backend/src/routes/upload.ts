import { Router } from 'express';
import { UploadController, upload } from '../controllers/UploadController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const uploadController = new UploadController();

router.post('/', authMiddleware, upload.single('image'), uploadController.uploadImage);

export default router; 