/**
 * @fileoverview Serviço responsável pelo ciclo de vida do jogo (lobby, criação, início, fim)
 * A lógica de turnos, baralho e regras UNO foi delegada para serviços especializados:
 * - DeckService: criação, embaralhamento e distribuição do baralho
 * - TurnService: gerenciamento de turnos, jogadas e compra de cartas
 * - UnoRulesService: dizer UNO e desafiar
 *
 * @module services/gameService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');
const gameRepository = require('../Repository/gameRepository');
const Result = require('../utils/Result');
const deckService = require('./deckService');
const turnService = require('./turnService');
const unoRulesService = require('./unoRulesService');

/**
 * Classe de serviço para operações de ciclo de vida do jogo UNO
 * @class GameService
 */
class GameService {

  // ========================================================
  // LOBBY / LIFECYCLE
  // ========================================================

  /**
   * Cria um novo jogo e adiciona o criador automaticamente como primeiro jogador
   * @param {Object} data - Dados do jogo (nome, regras, maxPlayers)
   * @param {number} creatorId - ID do usuário criador
   * @returns {Promise<Game>} O objeto do jogo criado
   */
  async createGame(data, creatorId) {
    const game = await Game.create({
      name: data.name,
      rules: data.rules,
      maxPlayers: data.maxPlayers,
      creatorId: creatorId,
      status: 'waiting'
    });

    await GamePlayer.create({
      gameId: game.id,
      playerId: creatorId,
      isReady: true
    });

    return game;
  }

  /**
   * Permite que um usuário entre em um jogo existente
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do jogador
   * @returns {Promise<boolean>} true se entrou com sucesso
   */
  async joinGame(gameId, playerId) {
    const game = await this.getGameById(gameId);

    if (game.status !== 'waiting') {
      throw new Error('Não é possível entrar em um jogo que já iniciou ou finalizou');
    }

    const currentPlayers = await GamePlayer.count({ where: { gameId } });
    if (currentPlayers >= game.maxPlayers) {
      throw new Error('O jogo está cheio');
    }

    const alreadyIn = await GamePlayer.findOne({
      where: { gameId, playerId }
    });

    if (alreadyIn) {
      throw new Error('Usuário já está neste jogo');
    }

    await GamePlayer.create({
      gameId,
      playerId,
      isReady: false
    });

    return true;
  }

  /**
   * Alterna o status de "pronto" de um jogador no jogo
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do jogador
   * @returns {Promise<Object>} { isReady, message }
   */
  async toggleReady(gameId, playerId) {
    const game = await this.getGameById(gameId);

    if (game.status !== 'waiting') {
      throw new Error('Não é possível alterar o status de pronto em um jogo que já iniciou ou finalizou');
    }

    const gamePlayer = await GamePlayer.findOne({
      where: { gameId, playerId }
    });

    if (!gamePlayer) {
      throw new Error('Usuário não está neste jogo');
    }

    const newReadyStatus = !gamePlayer.isReady;
    await gamePlayer.update({ isReady: newReadyStatus });

    return {
      isReady: newReadyStatus,
      message: newReadyStatus ? 'Você está pronto!' : 'Você não está mais pronto'
    };
  }

  /**
   * Permite que um usuário abandone um jogo em andamento
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do jogador
   * @returns {Promise<boolean>} true se saiu com sucesso
   */
  async leaveGame(gameId, playerId) {
    const game = await this.getGameById(gameId);

    if (game.status !== 'in_progress' && game.status !== 'started') {
      throw new Error('O jogo não está em andamento');
    }

    const playerInGame = await GamePlayer.findOne({
      where: { gameId, playerId }
    });

    if (!playerInGame) {
      throw new Error('Usuário não está neste jogo');
    }

    await playerInGame.destroy();

    const remainingPlayers = await GamePlayer.count({ where: { gameId } });
    if (remainingPlayers <= 1) {
      await game.update({ status: 'finished' });
    }

    return true;
  }

  /**
   * Finaliza um jogo (apenas o criador pode encerrar)
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do usuário que está tentando encerrar
   * @returns {Promise<boolean>} true se encerrou com sucesso
   */
  async endGame(gameId, userId) {
    const game = await this.getGameById(gameId);

    if (game.creatorId !== userId) {
      throw new Error('Apenas o criador do jogo pode encerrar a partida');
    }

    if (game.status !== 'in_progress' && game.status !== 'started') {
      throw new Error('O jogo não está em andamento');
    }

    await game.update({ status: 'finished' });
    return true;
  }

  /**
   * Inicia o jogo - configura turnOrder para cada jogador
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do criador
   * @returns {Promise<boolean>} true se iniciou com sucesso
   */
  async startGame(gameId, userId) {
    const game = await this.getGameById(gameId);
    if (game.creatorId !== userId) {
      throw new Error('Apenas o criador do jogo pode iniciar a partida');
    }

    const players = await GamePlayer.findAll({ where: { gameId }, order: [['id', 'ASC']] });
    if (players.length < 2) {
      throw new Error('É necessário pelo menos 2 jogadores para iniciar');
    }

    const allReady = players.every(p => p.isReady === true);
    if (!allReady) {
      throw new Error('Nem todos os jogadores estão prontos');
    }

    // Atribui turnOrder sequencial a cada jogador
    for (let i = 0; i < players.length; i++) {
      await players[i].update({
        turnOrder: i,
        isCurrentTurn: i === 0
      });
    }

    await game.update({ status: 'started', currentPlayerIndex: 0, direction: 1 });
    return true;
  }

  // ========================================================
  // CONSULTAS
  // ========================================================

  /**
   * Busca um jogo pelo seu ID
   * @param {number} id - ID do jogo
   * @returns {Promise<Game>} instância do jogo
   */
  async getGameById(id) {
    const game = await Game.findByPk(id);
    if (!game) throw new Error('Jogo não encontrado');
    return game;
  }

  /**
   * Obtém o estado atual do jogo
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Object>} { game_id, state }
   */
  async getGameState(gameId) {
    const game = await this.getGameById(gameId);
    return {
      game_id: game.id,
      state: game.status
    };
  }

  /**
   * Obtém a lista de jogadores no jogo
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Object>} { game_id, players }
   */
  async getGamePlayers(gameId) {
    const game = await this.getGameById(gameId);
    const gamePlayers = await GamePlayer.findAll({
      where: { gameId },
      include: [{ model: Player, attributes: ['id', 'username'] }]
    });

    const players = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
    return { game_id: game.id, players: players };
  }

  /**
   * Obtém o jogador atual (quem deve jogar)
   * @param {number} gameId - ID do jogo
   * @returns {Promise<string>} username do jogador atual
   */
  async getCurrentPlayer(gameId) {
    const gamePlayer = await GamePlayer.findOne({
      where: { gameId, isCurrentTurn: true },
      include: [{ model: Player, attributes: ['username'] }]
    });
    if (!gamePlayer || !gamePlayer.Player) throw new Error('Nenhum jogador atual');
    return gamePlayer.Player.username;
  }

  /**
   * Obtém a carta do topo da pilha de descarte
   * @param {number} gameId - ID do jogo
   * @returns {Promise<string>} carta do topo
   */
  async getTopCard(gameId) {
    const game = await this.getGameById(gameId);
    const discardPile = game.discardPile || [];
    if (discardPile.length === 0) throw new Error('Pilha vazia');
    return discardPile[discardPile.length - 1];
  }

  /**
   * Obtém as pontuações atuais (usando Result Monad)
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Result>} Result com scores ou erro
   */
  async getScores(gameId) {
    try {
      const game = await Game.findByPk(gameId);
      if (!game) {
        return Result.failure('Jogo não encontrado');
      }

      const gamePlayers = await gameRepository.getGameScores(gameId);

      if (!gamePlayers || gamePlayers.length === 0) {
        return Result.failure('Nenhum jogador encontrado neste jogo.');
      }

      const scoresMap = {};
      gamePlayers.forEach(gp => {
        const playerName = gp.Player ? gp.Player.name : `Player${gp.playerId}`;
        scoresMap[playerName] = gp.score !== undefined ? gp.score : 0;
      });

      return Result.success({
        gameId: gameId,
        scores: scoresMap
      });
    } catch (error) {
      return Result.failure('Erro ao processar pontuações: ' + error.message);
    }
  }

  // ========================================================
  // CRUD
  // ========================================================

  /**
   * Atualiza os dados de um jogo
   * @param {number} id - ID do jogo
   * @param {Object} data - dados a atualizar
   * @returns {Promise<Game>} jogo atualizado
   */
  async updateGame(id, data) {
    const game = await this.getGameById(id);
    if (data.maxPlayers) {
      const currentPlayersCount = await GamePlayer.count({ where: { gameId: id } });
      if (data.maxPlayers < currentPlayersCount) {
        throw new Error(`Não é possível reduzir o limite para ${data.maxPlayers}.`);
      }
    }
    return await game.update(data);
  }

  /**
   * Remove um jogo
   * @param {number} id - ID do jogo
   * @returns {Promise<Object>} mensagem de sucesso
   */
  async deleteGame(id) {
    const game = await this.getGameById(id);
    await game.destroy();
    return { message: 'Jogo removido com sucesso' };
  }

  // ========================================================
  // DELEGAÇÃO PARA SERVIÇOS ESPECIALIZADOS
  // ========================================================

  /**
   * Distribui cartas aos jogadores (delega para DeckService)
   * @param {number} gameId - ID do jogo
   * @param {number} [cardsPerPlayer=7] - cartas por jogador
   * @returns {Promise<Object>} resultado da distribuição
   */
  async dealCards(gameId, cardsPerPlayer = 7) {
    const game = await this.getGameById(gameId);
    const gamePlayers = await turnService.getOrderedPlayers(gameId);

    const { playerHands, firstCard, firstColor, remainingDeck } = await deckService.dealCards(gameId, gamePlayers, cardsPerPlayer);

    await game.update({
      discardPile: [firstCard],
      deck: remainingDeck,
      currentColor: firstColor,
      direction: 1,
      currentPlayerIndex: 0,
      drawPenalty: 0
    });

    return { message: 'Cards dealt successfully.', players: playerHands, firstCard };
  }

  /**
   * Joga uma carta (delega para TurnService)
   * @param {number} gameId
   * @param {string} playerUsername
   * @param {string} cardPlayed
   * @param {string} [chosenColor]
   * @returns {Promise<Object>}
   */
  async playCard(gameId, playerUsername, cardPlayed, chosenColor = null) {
    return turnService.playCard(gameId, playerUsername, cardPlayed, chosenColor);
  }

  /**
   * Compra uma carta do baralho (delega para TurnService)
   * @param {number} gameId
   * @param {string} playerUsername
   * @returns {Promise<Object>}
   */
  async drawCard(gameId, playerUsername) {
    return turnService.drawCard(gameId, playerUsername);
  }

  /**
   * Diz UNO (delega para UnoRulesService)
   * @param {number} gameId
   * @param {string} playerUsername
   * @returns {Promise<Object>}
   */
  async sayUno(gameId, playerUsername) {
    return unoRulesService.sayUno(gameId, playerUsername);
  }

  /**
   * Desafia um jogador que não disse UNO (delega para UnoRulesService)
   * @param {number} gameId
   * @param {string} challengerUsername
   * @param {string} challengedUsername
   * @returns {Promise<Object>}
   */
  async challengeUno(gameId, challengerUsername, challengedUsername) {
    return unoRulesService.challengeUno(gameId, challengerUsername, challengedUsername);
  }

  /**
   * Ação unificada de turno (delega para TurnService)
   * @param {number} gameId
   * @param {string} playerUsername
   * @param {string} action
   * @param {string} [card]
   * @param {string} [chosenColor]
   * @returns {Promise<Object>}
   */
  async executeTurn(gameId, playerUsername, action, card = null, chosenColor = null) {
    return turnService.executeTurn(gameId, playerUsername, action, card, chosenColor);
  }

  /**
   * Encontra cartas válidas usando generator recursivo (delega para TurnService)
   * @param {string[]} hand
   * @param {string} topCard
   * @param {string} currentColor
   * @returns {Generator<string>}
   */
  findValidCardsRecursive(hand, topCard, currentColor) {
    return turnService.findValidCardsRecursive(hand, topCard, currentColor);
  }
}

module.exports = new GameService();
