/**
 * @fileoverview Rotas da API para gerenciamento de jogos
 * @module routes/gameRoutes
 */

const express = require('express');

/**
 * Router Express para as rotas de games
 * @type {express.Router}
 */
const router = express.Router();

const gameController = require('../controllers/gameController');

/**
 * @route POST /api/games
 * @description Cria um novo jogo
 * @access Public
 * @body {string} title - Título do jogo (obrigatório)
 * @body {string} [status='active'] - Status do jogo
 * @body {number} [maxPlayers=4] - Número máximo de jogadores
 * @returns {Object} 201 - Jogo criado com sucesso
 * @returns {Object} 400 - Erro de validação
 */
router.post('/', gameController.create);

/**
 * @route GET /api/games/:id
 * @description Busca um jogo pelo ID
 * @access Public
 * @param {string} id - ID do jogo
 * @returns {Object} 200 - Jogo encontrado
 * @returns {Object} 404 - Jogo não encontrado
 */
router.get('/:id', gameController.getById);

/**
 * @route PUT /api/games/:id
 * @description Atualiza um jogo existente
 * @access Public
 * @param {string} id - ID do jogo
 * @body {string} [title] - Novo título do jogo
 * @body {string} [status] - Novo status do jogo
 * @body {number} [maxPlayers] - Novo número máximo de jogadores
 * @returns {Object} 200 - Jogo atualizado com sucesso
 * @returns {Object} 400 - Erro de validação
 */
router.put('/:id', gameController.update);

/**
 * @route DELETE /api/games/:id
 * @description Remove um jogo do sistema
 * @access Public
 * @param {string} id - ID do jogo
 * @returns {Object} 200 - Jogo removido com sucesso
 * @returns {Object} 404 - Jogo não encontrado
 */
router.delete('/:id', gameController.delete);

module.exports = router;
