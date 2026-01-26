/**
 * @fileoverview Controller para gerenciamento de jogos
 * @module controllers/gameController
 */

const gameService = require('../services/gameService');


exports.create = async (req, res) => {
  try {
    const game = await gameService.createGame(req.body, req.user.id);
    // Retorno manual conforme seu requisito nº 5
    return res.status(201).json({ 
      message: "Game created successfully", 
      game_id: game.id 
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.join = async (req, res) => {
  try {
    const { game_id } = req.body;
    await gameService.joinGame(game_id, req.user.id);
    return res.json({ message: 'User joined the game successfully' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.start = async (req, res) => {
  try {
    const { game_id } = req.body;
    await gameService.startGame(game_id, req.user.id);
    return res.json({ message: 'Game started successfully' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const game = await gameService.getGameById(req.params.id);
    // Retornando os dados sem a necessidade da classe DTO
    return res.json({
      id: game.id,
      name: game.name,
      rules: game.rules,
      status: game.status,
      maxPlayers: game.maxPlayers
    });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const game = await gameService.updateGame(req.params.id, req.body);
    return res.json(new GameDTO(game));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await gameService.deleteGame(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};