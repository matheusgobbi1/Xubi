import { Request, Response } from 'express';
import { AppDataSource } from '../server';
import { User } from '../models/User';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export class UserController {
  async updateAvatar(req: Request, res: Response) {
    try {
      console.log('Recebendo requisição de atualização de avatar');
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      
      const { avatarUrl } = req.body;
      const userId = req.user.id;

      console.log('ID do usuário:', userId);
      console.log('URL do avatar:', avatarUrl);

      if (!avatarUrl) {
        console.log('URL do avatar não fornecida');
        return res.status(400).json({ error: 'URL do avatar é obrigatória' });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        console.log('Usuário não encontrado');
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      console.log('Usuário encontrado, atualizando avatar...');
      user.avatar = avatarUrl;
      await userRepository.save(user);

      console.log('Avatar atualizado com sucesso');
      return res.json({ user });
    } catch (error) {
      console.error('Erro detalhado ao atualizar avatar:', error);
      return res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
  }
} 