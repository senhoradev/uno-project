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
const auth = require('../middlewares/auth'); // Middleware necessário para validar o token

/**
 * @route POST /api/games
 * @description 5. Criar um novo jogo
 * @access Private (Requer Token)
 * @body {string} name - Nome do jogo (obrigatório)
 * @body {string} [rules] - Regras do jogo
 * @returns {Object} 201 - Jogo criado com sucesso e game_id
 */
router.post('/', auth, gameController.create);

/**
 * @route POST /api/games/join
 * @description 6. Juntar-se a um jogo existente
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo para entrar
 * @returns {Object} 200 - Usuário adicionado ao jogo com sucesso
 */
router.post('/join', auth, gameController.join);

/**
 * @route POST /api/games/ready
 * @description Alterna o status de "pronto" do jogador no jogo
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Status de ready atualizado
 */
router.post('/ready', auth, gameController.toggleReady);

/**
 * @route POST /api/games/start
 * @description 7. Começar o jogo (apenas criador e todos prontos)
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo para iniciar
 * @returns {Object} 200 - Jogo iniciado com sucesso
 */
router.post('/start', auth, gameController.start);
router.post('/leave', auth, gameController.leave);
router.post('/end', auth, gameController.end); 
router.post('/state', auth, gameController.getState);
router.post('/players', auth, gameController.getPlayers);

/**
 * @route GET /api/games/:id
 * @description Busca um jogo pelo ID
 * @access Public
 */
router.get('/:id', gameController.getById);

/**
 * @route PUT /api/games/:id
 * @description Atualiza um jogo existente
 * @access Public
 */
router.put('/:id', gameController.update);

/**
 * @route DELETE /api/games/:id
 * @description Remove um jogo do sistema
 * @access Public
 */
router.delete('/:id', gameController.delete);

/**
 * @route POST /api/games/current-player
 * @description Obter o jogador atual que deve jogar uma carta
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Jogador atual
 */
router.post('/current-player', auth, gameController.getCurrentPlayer);

/**
 * @route POST /api/games/top-card
 * @description Pegar a carta do topo da pilha de descarte
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Carta do topo
 */
router.post('/top-card', auth, gameController.getTopCard);

/**
 * @route POST /api/games/scores
 * @description Obter pontuações atuais de todos os jogadores
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Pontuações dos jogadores
 */
router.post('/scores', auth, gameController.getScores);

module.exports = router;