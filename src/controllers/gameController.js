/**
 * @fileoverview Controller para gerenciamento de jogos
 * @module controllers/gameController
 */

const gameService = require('../services/gameService');

/**
 * Formata erros do Sequelize para resposta da API
 * @param {Error} error - Erro capturado
 * @returns {Object} Objeto com erro(s) formatado(s)
 */
const formatError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return { errors };
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return { error: 'Registro já existe com esses dados' };
  }
  
  return { error: error.message };
};

/**
 * 5. Criar um novo jogo
 * @async
 * @function create
 */
exports.create = async (req, res) => {
  try {
    // req.user.id vem do middleware de autenticação
    const game = await gameService.createGame(req.body, req.user.id);
    
    // Retorna o JSON de saída conforme especificado no requisito
    res.status(201).json({
      message: "Game created successfully",
      game_id: game.id
    });
  } catch (error) {
    res.status(400).json(formatError(error));
  }
};

/**
 * 6. Juntar-se a um jogo existente
 * @async
 * @function join
 */
exports.join = async (req, res) => {
  try {
    const { game_id } = req.body;
    // req.user.id identifica o jogador através do token
    await gameService.joinGame(game_id, req.user.id);
    
    res.json({ message: "User joined the game successfully" });
  } catch (error) {
    res.status(400).json(formatError(error));
  }
};

/**
 * 7. Começar um jogo quando todos os jogadores estiverem prontos
 * @async
 * @function start
 */
exports.start = async (req, res) => {
  try {
    const { game_id } = req.body;
    // Verifica se o solicitante (req.user.id) é o criador e se todos estão prontos
    await gameService.startGame(game_id, req.user.id);
    
    res.json({ message: "Game started successfully" });
  } catch (error) {
    res.status(400).json(formatError(error));
  }
};

/**
 * Busca um jogo pelo ID
 * @async
 * @function getById
 */
exports.getById = async (req, res) => {
  try {
    const game = await gameService.getGameById(req.params.id);
    res.json(game);
  } catch (error) {
    res.status(404).json(formatError(error));
  }
};

/**
 * Atualiza um jogo existente
 * @async
 * @function update
 */
exports.update = async (req, res) => {
  try {
    const game = await gameService.updateGame(req.params.id, req.body);
    res.json(game);
  } catch (error) {
    res.status(400).json(formatError(error));
  }
};

/**
 * Remove um jogo do sistema
 * @async
 * @function delete
 */
exports.delete = async (req, res) => {
  try {
    const result = await gameService.deleteGame(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json(formatError(error));
  }
};