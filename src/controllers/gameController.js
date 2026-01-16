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
  // Se for erro de validação do Sequelize com múltiplos erros
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return { errors };
  }
  
  // Se for erro de constraint única (ex: título duplicado)
  if (error.name === 'SequelizeUniqueConstraintError') {
    return { error: 'Registro já existe com esses dados' };
  }
  
  // Erro genérico
  return { error: error.message };
};

/**
 * Cria um novo jogo
 * @async
 * @function create
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.body - Corpo da requisição
 * @param {string} req.body.title - Título do jogo
 * @param {string} [req.body.status='active'] - Status do jogo
 * @param {number} [req.body.maxPlayers=4] - Número máximo de jogadores
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Retorna o jogo criado com status 201 ou erro 400
 */
exports.create = async (req, res) => {
  try {
    console.log(`[POST /api/games] Criando jogo: ${JSON.stringify(req.body)}`);
    const game = await gameService.createGame(req.body);
    console.log(`[POST /api/games] ✓ Jogo criado com sucesso - ID: ${game.id}, Título: ${game.title}`);
    res.status(201).json(game);
  } catch (error) {
    console.error(`[POST /api/games] ✗ Erro ao criar jogo: ${error.message}`);
    res.status(400).json(formatError(error));
  }
};

/**
 * Busca um jogo pelo ID
 * @async
 * @function getById
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.id - ID do jogo
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Retorna o jogo encontrado ou erro 404
 */
exports.getById = async (req, res) => {
  try {
    console.log(`[GET /api/games/${req.params.id}] Buscando jogo...`);
    const game = await gameService.getGameById(req.params.id);
    console.log(`[GET /api/games/${req.params.id}] ✓ Jogo encontrado: ${game.title}`);
    res.json(game);
  } catch (error) {
    console.error(`[GET /api/games/${req.params.id}] ✗ Erro: ${error.message}`);
    res.status(404).json(formatError(error));
  }
};

/**
 * Atualiza um jogo existente
 * @async
 * @function update
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.id - ID do jogo a ser atualizado
 * @param {Object} req.body - Dados a serem atualizados
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Retorna o jogo atualizado ou erro 400
 */
exports.update = async (req, res) => {
  try {
    console.log(`[PUT /api/games/${req.params.id}] Atualizando jogo: ${JSON.stringify(req.body)}`);
    const game = await gameService.updateGame(req.params.id, req.body);
    console.log(`[PUT /api/games/${req.params.id}] ✓ Jogo atualizado: ${game.title}`);
    res.json(game);
  } catch (error) {
    console.error(`[PUT /api/games/${req.params.id}] ✗ Erro: ${error.message}`);
    res.status(400).json(formatError(error));
  }
};

/**
 * Remove um jogo do sistema
 * @async
 * @function delete
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.id - ID do jogo a ser removido
 * @param {Object} res - Objeto de resposta Express
 * @returns {Promise<void>} Retorna mensagem de sucesso ou erro 404
 */
exports.delete = async (req, res) => {
  try {
    console.log(`[DELETE /api/games/${req.params.id}] Removendo jogo...`);
    const result = await gameService.deleteGame(req.params.id);
    console.log(`[DELETE /api/games/${req.params.id}] ✓ Jogo removido com sucesso`);
    res.json(result);
  } catch (error) {
    console.error(`[DELETE /api/games/${req.params.id}] ✗ Erro: ${error.message}`);
    res.status(404).json(formatError(error));
  }
};
