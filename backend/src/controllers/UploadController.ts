import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    console.log('Diretório de upload:', uploadDir);
    if (!fs.existsSync(uploadDir)) {
      console.log('Criando diretório de upload...');
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Nome do arquivo gerado:', filename);
    cb(null, filename);
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    console.log('Tipo do arquivo:', file.mimetype);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use apenas imagens JPEG, PNG ou GIF.'));
    }
  }
});

export class UploadController {
  async uploadImage(req: Request, res: Response) {
    try {
      console.log('Recebendo requisição de upload...');
      console.log('Headers:', req.headers);
      console.log('File:', req.file);
      console.log('Body:', req.body);

      if (!req.file) {
        console.log('Nenhum arquivo recebido');
        return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
      }

      // Construir a URL completa da imagem
      const baseUrl = process.env.API_URL || 'http://192.168.0.230:3000';
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      console.log('URL da imagem gerada:', imageUrl);
      return res.json({ url: imageUrl });
    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
    }
  }
} 