const express = require('express');
const router = express.Router(); // Cria uma instância para definir as rotas
 
// Importa a lógica de manipulação dos scoringHistory
const scoringHistory = require('../controllers/scoringHistoryController');
 
// Rota para listar todos os scoringHistory (GET /)
router.get('/', scoringHistory.getAll);
// Rota para buscar scores por gameId (GET /game/:gameId)
router.get('/game/:gameId', scoringHistory.getByGameId);
// Rota para buscar scores por playerId (GET /player/:playerId)
router.get('/player/:playerId', scoringHistory.getByPlayerId);
// Rota para criar um novo scoringHistory (POST /)
router.post('/', scoringHistory.create);
// Rota para buscar um scoringHistory pelo ID (GET /:id)
router.get('/:id', scoringHistory.getById);
// Rota para atualizar os dados de um scoringHistory pelo ID (PUT /:id)
router.put('/:id', scoringHistory.update);
// Rota para remover um scoringHistory pelo ID (DELETE /:id)
router.delete('/:id', scoringHistory.delete);
 
// Exporta o roteador para ser utilizado no arquivo principal
module.exports = router;