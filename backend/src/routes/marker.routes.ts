import { Router } from 'express';
import { body } from 'express-validator';
import { createMarker, getMarkers, updateMarker, deleteMarker } from '../controllers/marker.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de marcadores requerem autenticação
router.use(authMiddleware);

// Criar marcador
router.post(
  '/',
  [
    body('latitude').isNumeric().withMessage('Latitude inválida'),
    body('longitude').isNumeric().withMessage('Longitude inválida'),
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('address').notEmpty().withMessage('Endereço é obrigatório'),
  ],
  createMarker
);

// Listar marcadores do usuário
router.get('/', getMarkers);

// Atualizar marcador
router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Título não pode ser vazio'),
    body('description').optional().notEmpty().withMessage('Descrição não pode ser vazia'),
  ],
  updateMarker
);

// Deletar marcador
router.delete('/:id', deleteMarker);

export default router; 