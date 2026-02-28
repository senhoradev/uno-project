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

/**
 * @route POST /api/games/deal-cards
 * @description Distribuir cartas aos jogadores usando recursão
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {number} [cardsPerPlayer=7] - Número de cartas por jogador (padrão: 7)
 * @returns {Object} 200 - Cartas distribuídas com sucesso
 * @example
 * Request body:
 * {
 *   "game_id": 1,
 *   "cardsPerPlayer": 7
 * }
 * Response:
 * {
 *   "message": "Cards dealt successfully.",
 *   "players": {
 *     "Player1": ["Red 3", "Blue Skip", "Green 7", ...],
 *     "Player2": ["Yellow Reverse", "Red 5", "Blue Draw Two", ...]
 *   }
 * }
 */
router.post('/deal-cards', auth, gameController.dealCards);

/**
 * @route PUT /api/games/play-card
 * @description Jogar uma carta seguindo as regras do UNO
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @body {string} cardPlayed - Carta a ser jogada
 * @body {string} [chosenColor] - Cor escolhida (obrigatório para cartas Wild: "Red", "Blue", "Green", "Yellow")
 * @returns {Object} 200 - Carta jogada com sucesso
 * @returns {Object} 400 - Carta inválida
 * @example
 * Request body:
 * {
 *   "game_id": 1,
 *   "player": "Player1",
 *   "cardPlayed": "Green 7"
 * }
 * Response (200 OK):
 * {
 *   "message": "Card played successfully.",
 *   "cardPlayed": "Green 7",
 *   "nextPlayer": "Player2",
 *   "remainingCards": 6
 * }
 * Response (400 Bad Request):
 * {
 *   "message": "Invalid card. Please play a card that matches the top card on the discard pile."
 * }
 */
router.put('/play-card', auth, gameController.playCard);

/**
 * @route POST /api/games/valid-cards
 * @description Obter cartas válidas que um jogador pode jogar (usando recursão/generator)
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @returns {Object} 200 - Lista de cartas válidas
 * @example
 * Request body:
 * {
 *   "game_id": 1,
 *   "player": "Player1"
 * }
 * Response:
 * {
 *   "player": "Player1",
 *   "topCard": "Red 7",
 *   "currentColor": null,
 *   "validCards": ["Red 3", "Red Skip", "Green 7", "Wild"],
 *   "totalValidCards": 4
 * }
 */
router.post('/valid-cards', auth, gameController.getValidCards);

/**
 * @route PUT /api/games/draw-card
 * @description Comprar uma carta do baralho quando não pode jogar
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @returns {Object} 200 - Carta comprada com sucesso
 * @example
 * Request body:
 * {
 *   "game_id": 1,
 *   "player": "Player1"
 * }
 * Response:
 * {
 *   "message": "Player1 drew a card from the deck.",
 *   "cardDrawn": "Green Reverse",
 *   "nextPlayer": "Player2"
 * }
 */
router.put('/draw-card', auth, gameController.drawCard);

/**
 * @route PATCH /api/games/say-uno
 * @description Jogador diz "UNO" quando tem 1 carta restante
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @body {string} action - Deve ser "Say UNO"
 * @returns {Object} 200 - UNO dito com sucesso
 * @example
 * Request body:
 * {
 *   "game_id": 1,
 *   "player": "Player1",
 *   "action": "Say UNO"
 * }
 * Response:
 * {
 *   "message": "Player1 said UNO successfully."
 * }
 */
router.patch('/say-uno', auth, gameController.sayUno);

/**
 * @route POST /api/games/challenge-uno
 * @description Desafiar um jogador que não disse "UNO"
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} challenger - Nome do desafiante
 * @body {string} challengedPlayer - Nome do jogador desafiado
 * @returns {Object} 200 - Desafio bem-sucedido / 400 - Desafio falhou
 * @example
 * Request body:
 * {
 *   "game_id": 1,
 *   "challenger": "Player2",
 *   "challengedPlayer": "Player1"
 * }
 * Response (200 OK):
 * {
 *   "message": "Challenge successful. Player1 forgot to say UNO and draws 2 cards."
 * }
 * Response (400 Bad Request):
 * {
 *   "message": "Challenge failed. Player1 said UNO on time."
 * }
 */
router.post('/challenge-uno', auth, gameController.challengeUno);

/**
 * @route PUT /api/games/turn
 * @description Ação unificada de turno (jogar carta ou comprar carta). O turno termina automaticamente.
 * @access Private (Requer Token)
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @body {string} action - "play-card" ou "draw-card"
 * @body {string} [card] - Carta a jogar (obrigatório se action = "play-card")
 * @body {string} [chosenColor] - Cor escolhida (obrigatório para Wild: "Red", "Blue", "Green", "Yellow")
 * @returns {Object} 200 - Turno executado com sucesso
 * @example
 * Request body (jogar carta):
 * {
 *   "game_id": 1,
 *   "player": "Player1",
 *   "action": "play-card",
 *   "card": "Blue 5"
 * }
 * Response:
 * {
 *   "message": "Player1 played Blue 5. Turn ended."
 * }
 * 
 * Request body (comprar carta):
 * {
 *   "game_id": 1,
 *   "player": "Player2",
 *   "action": "draw-card"
 * }
 * Response:
 * {
 *   "message": "Player2 drew a card. Turn ended."
 * }
 */
router.put('/turn', auth, gameController.executeTurn);

module.exports = router;
