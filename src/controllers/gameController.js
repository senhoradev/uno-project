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

/**
 * Alterna o status de "pronto" do jogador no jogo
 */
exports.toggleReady = async (req, res) => {
  try {
    const { game_id } = req.body;
    const result = await gameService.toggleReady(game_id, req.user.id);
    return res.json({ 
      message: result.message,
      isReady: result.isReady 
    });
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

/**
 * Abandona um jogo em progresso
 */
exports.leave = async (req, res) => {
  try {
    const { game_id } = req.body;
    await gameService.leaveGame(game_id, req.user.id);
    return res.json({ message: 'User left the game successfully' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Finaliza um jogo 
 */
exports.end = async (req, res) => {
  try {
    const { game_id } = req.body;
    await gameService.endGame(game_id, req.user.id);
    return res.json({ message: 'Game ended successfully' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Obtém o estado atual do jogo 
 */
exports.getState = async (req, res) => {
  try {
    const { game_id } = req.body;
    const state = await gameService.getGameState(game_id);
    return res.json(state);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

/**
 * Obtém a lista de jogadores no jogo 
 */
exports.getPlayers = async (req, res) => {
  try {
    const { game_id } = req.body;
    const players = await gameService.getGamePlayers(game_id);
    return res.json(players);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

/**
 * Obtém o jogador atual que deve jogar uma carta
 */
exports.getCurrentPlayer = async (req, res) => {
  try {
    const { game_id } = req.body;
    const currentPlayer = await gameService.getCurrentPlayer(game_id);
    return res.json({
      game_id,
      current_player: currentPlayer
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Obtém a carta do topo da pilha de descarte
 */
exports.getTopCard = async (req, res) => {
  try {
    const { game_id } = req.body;
    const topCard = await gameService.getTopCard(game_id);
    return res.json({
      game_id,
      top_card: topCard
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Obtém as pontuações atuais de todos os jogadores
 */
exports.getScores = async (req, res) => {
  try {
    const { game_id } = req.body;
    const scores = await gameService.getScores(game_id);
    return res.json({
      game_id,
      scores
    });
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