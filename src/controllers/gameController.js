/**
 * @fileoverview Controller para gerenciamento de jogos
 * @module controllers/gameController
 */
const Game = require('../models/Game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');
const gameService = require('../services/gameService');
const GameResponseDTO = require('../DTO/Response/GameRespondeDTO');


exports.create = async (req, res) => {
  try {
    const game = await gameService.createGame(req.body, req.user.id);
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
 * @route POST /api/games/scores
 */
exports.getScores = async (req, res) => {
  try {
    const { game_id } = req.body;

    if (!game_id) {
      return res.status(400).json({ error: 'game_id é obrigatório' });
    }

    const result = await gameService.getScores(game_id);

    if (result.isSuccess) {
      const formattedResponse = GameResponseDTO.scoresResponse(
        result.value.gameId, 
        result.value.scores
      );

      return res.status(200).json({
        scores: formattedResponse.scores
      });
    }

    return res.status(404).json({ error: result.error });
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

/**
 * Distribui cartas aos jogadores usando recursão
 * @route POST /api/games/deal-cards
 * @body {number} game_id - ID do jogo
 * @body {number} [cardsPerPlayer=7] - Número de cartas por jogador
 */
exports.dealCards = async (req, res) => {
  try {
    const { game_id, cardsPerPlayer = 7 } = req.body;
    
    if (!game_id) {
      return res.status(400).json({ error: 'game_id é obrigatório' });
    }

    const result = await gameService.dealCards(game_id, cardsPerPlayer);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Joga uma carta seguindo as regras do UNO
 * @route PUT /api/games/play-card
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 * @body {string} cardPlayed - Carta a ser jogada
 * @body {string} [chosenColor] - Cor escolhida (obrigatório para cartas Wild)
 */
exports.playCard = async (req, res) => {
  try {
    const { game_id, player, cardPlayed, chosenColor } = req.body;
    
    if (!game_id) {
      return res.status(400).json({ error: 'game_id é obrigatório' });
    }
    
    if (!player) {
      return res.status(400).json({ error: 'player é obrigatório' });
    }
    
    if (!cardPlayed) {
      return res.status(400).json({ error: 'cardPlayed é obrigatório' });
    }

    const result = await gameService.playCard(game_id, player, cardPlayed, chosenColor);
    return res.status(200).json(result);
  } catch (error) {
    // Se for erro de validação de carta, retorna 400
    if (error.message.includes('Invalid card')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
};

/**
 * Obtém as cartas válidas que um jogador pode jogar (usando recursão/generator)
 * @route POST /api/games/valid-cards
 * @body {number} game_id - ID do jogo
 * @body {string} player - Nome do jogador
 */
exports.getValidCards = async (req, res) => {
  try {
    const { game_id, player } = req.body;
    
    if (!game_id) {
      return res.status(400).json({ error: 'game_id é obrigatório' });
    }
    
    if (!player) {
      return res.status(400).json({ error: 'player é obrigatório' });
    }

    
    const game = await Game.findByPk(game_id);
    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    const gamePlayers = await GamePlayer.findAll({
      where: { gameId: game_id },
      include: [{
        model: Player,
        attributes: ['username']
      }]
    });

    const gamePlayer = gamePlayers.find(gp => gp.Player && gp.Player.username === player);
    if (!gamePlayer) {
      return res.status(404).json({ error: 'Jogador não encontrado neste jogo' });
    }

    const playerHand = gamePlayer.hand || [];
    const discardPile = game.discardPile || [];
    const topCard = discardPile[discardPile.length - 1];

    if (!topCard) {
      return res.status(400).json({ error: 'Não há carta na pilha de descarte' });
    }

    // Usa o generator recursivo para encontrar cartas válidas
    const validCards = [];
    const generator = gameService.findValidCardsRecursive(playerHand, topCard, game.currentColor);
    
    for (const card of generator) {
      validCards.push(card);
    }

    return res.json({
      player: player,
      topCard: topCard,
      currentColor: game.currentColor,
      validCards: validCards,
      totalValidCards: validCards.length
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};