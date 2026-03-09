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

/**
 * @route POST /api/games/leave
 * @description Permite que um usuário abandone um jogo em andamento
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Mensagem de sucesso
 */
router.post('/leave', auth, gameController.leave);

/**
 * @route POST /api/games/end
 * @description Finaliza um jogo (apenas o criador pode finalizar)
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Mensagem de sucesso
 */
router.post('/end', auth, gameController.end);

/**
 * @route POST /api/games/state
 * @description Obtém o estado atual do jogo (status)
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Objeto com ID e status do jogo
 */
router.post('/state', auth, gameController.getState);

/**
 * @route POST /api/games/players
 * @description Obtém a lista de jogadores de um jogo
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Lista de nomes dos jogadores
 */
router.post('/players', auth, gameController.getPlayers);

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

/**
 * @route POST /api/games/deal-cards
 * @description Distribuir cartas aos jogadores usando recursão
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {number} [cardsPerPlayer=7] - Número de cartas por jogador (padrão: 7)
 * @returns {Object} 200 - Cartas distribuídas com sucesso
 */
router.post('/deal-cards', auth, gameController.dealCards);

/**
 * @route PUT /api/games/play-card
 * @description Jogar uma carta seguindo as regras do UNO
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @body {string} cardPlayed - Carta a ser jogada (ex: "Red 7", "Blue Skip", "Green Reverse", "Wild")
 * @body {string} [chosenColor] - Cor escolhida (obrigatório para cartas Wild: "Red", "Blue", "Green", "Yellow")
 * @returns {Object} 200 - Carta jogada com sucesso
 * @returns {Object} 400 - Carta inválida
 */
router.put('/play-card', auth, gameController.playCard);

/**
 * @route POST /api/games/valid-cards
 * @description Obter cartas válidas que um jogador pode jogar (usando recursão/generator)
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @returns {Object} 200 - Lista de cartas válidas
 */
router.post('/valid-cards', auth, gameController.getValidCards);

/**
 * @route POST /api/games/nextTurn
 * @description Calcula o próximo turno no sentido horário
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Índice e nome do próximo jogador
 */
router.post('/nextTurn', auth, gameController.nextTurn);

/**
 * @route POST /api/games/drawCard
 * @description Compra uma carta do baralho quando não há jogada possível
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @returns {Object} 200 - Nova mão, carta comprada e se é jogável
 */
router.post('/drawCard', auth, gameController.drawCard);

// =============================================
// Rotas com parâmetro :id devem ficar por último
// para não interceptar rotas nomeadas acima
// =============================================

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

module.exports = router;