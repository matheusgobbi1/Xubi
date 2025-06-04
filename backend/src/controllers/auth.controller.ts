import { Request, Response } from 'express';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { AppDataSource } from '../server';
import { User } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const userExists = await userRepository.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    const user = new User();
    user.name = name;
    user.email = email;
    user.password = password;

    await user.hashPassword();
    await userRepository.save(user);

    const token = sign({ id: user.id }, process.env.JWT_SECRET || 'default_secret', {
      expiresIn: '1d',
    });

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = sign({ id: user.id }, process.env.JWT_SECRET || 'default_secret', {
      expiresIn: '1d',
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}; 