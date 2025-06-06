import { Request, Response } from "express";
import { AppDataSource } from "../server";
import { Marker } from "../models/Marker";
import { cache } from "../utils/cache";

export const createMarker = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, title, description, address, image } =
      req.body;
    const user_id = req.user.id;

    const markerRepository = AppDataSource.getRepository(Marker);

    const marker = new Marker();
    marker.latitude = latitude;
    marker.longitude = longitude;
    marker.title = title;
    marker.description = description;
    marker.address = address;
    marker.image = image;
    marker.user_id = user_id;

    await markerRepository.save(marker);

    // Limpa o cache dos marcadores deste usuário
    cache.delete(`markers:${user_id}`);

    return res.status(201).json(marker);
  } catch (error) {
    console.error("Erro ao criar marcador:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const getMarkers = async (req: Request, res: Response) => {
  try {
    const user_id = req.user.id;

    // Tenta obter do cache primeiro
    const cachedMarkers = cache.get(`markers:${user_id}`);
    if (cachedMarkers) {
      console.log("Retornando marcadores do cache");
      return res.json(cachedMarkers);
    }

    const markerRepository = AppDataSource.getRepository(Marker);

    const markers = await markerRepository.find({
      where: { user_id },
      order: { created_at: "DESC" },
    });

    // Salva no cache por 5 minutos
    cache.set(`markers:${user_id}`, markers);
    console.log("Retornando marcadores do banco");

    return res.json(markers);
  } catch (error) {
    console.error("Erro ao buscar marcadores:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const updateMarker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, image, isFavorite, visitedAt } = req.body;
    const user_id = req.user.id;

    const markerRepository = AppDataSource.getRepository(Marker);

    const marker = await markerRepository.findOne({
      where: { id, user_id },
    });

    if (!marker) {
      return res.status(404).json({ message: "Marcador não encontrado" });
    }

    marker.title = title || marker.title;
    marker.description = description || marker.description;
    marker.image = image || marker.image;
    marker.isFavorite =
      isFavorite !== undefined ? isFavorite : marker.isFavorite;
    marker.visitedAt = visitedAt || marker.visitedAt;

    await markerRepository.save(marker);

    // Limpa o cache dos marcadores deste usuário
    cache.delete(`markers:${user_id}`);

    return res.json(marker);
  } catch (error) {
    console.error("Erro ao atualizar marcador:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const deleteMarker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const markerRepository = AppDataSource.getRepository(Marker);

    const marker = await markerRepository.findOne({
      where: { id, user_id },
    });

    if (!marker) {
      return res.status(404).json({ message: "Marcador não encontrado" });
    }

    await markerRepository.remove(marker);

    // Limpa o cache dos marcadores deste usuário
    cache.delete(`markers:${user_id}`);

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar marcador:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
