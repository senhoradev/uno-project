const express = require('express');
const router = express.Router(); // Cria uma instância para definir as rotas

// Importa a lógica de manipulação dos jogadores
const playerController = require('../controllers/playerController');

// Rota para criar um novo jogador (POST /)
router.post('/', playerController.create);
// Rota para buscar um jogador pelo ID (GET /:id)
router.get('/:id', playerController.getById);
// Rota para atualizar os dados de um jogador pelo ID (PUT /:id)
router.put('/:id', playerController.update);
// Rota para remover um jogador pelo ID (DELETE /:id)
router.delete('/:id', playerController.delete);

// Exporta o roteador para ser utilizado no arquivo principal
module.exports = router;