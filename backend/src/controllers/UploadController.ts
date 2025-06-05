import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configurar o Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

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

      // Converter o buffer para stream
      const stream = Readable.from(req.file.buffer);

      // Upload para o Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'xubi-avatars',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              console.error('Erro no upload para o Cloudinary:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.pipe(uploadStream);
      });

      const result = await uploadPromise;
      console.log('Upload para o Cloudinary concluído:', result);

      return res.json({ url: (result as any).secure_url });
    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      return res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
    }
  }
} 