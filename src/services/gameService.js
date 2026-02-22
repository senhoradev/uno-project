/**
 * @fileoverview Serviço responsável pela lógica de negócio dos jogos
 * @module services/gameService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');
const gameRepository = require('../Repository/gameRepository');
const Result = require('../utils/Result');

/**
 * Classe de serviço para operações de Game
 * @class GameService
 */
class GameService {
  /**
   * Cria um novo jogo e adiciona o criador automaticamente como primeiro jogador
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
   * Permite que um usuário abandone um jogo
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
   * Finaliza um jogo
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
   * Obtém o estado atual do jogo
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
   * Inicia o jogo
   */
  async startGame(gameId, userId) {
    const game = await this.getGameById(gameId);
    if (game.creatorId !== userId) {
      throw new Error('Apenas o criador do jogo pode iniciar a partida');
    }

    const players = await GamePlayer.findAll({ where: { gameId } });
    if (players.length < 2) {
      throw new Error('É necessário pelo menos 2 jogadores para iniciar');
    }

    const allReady = players.every(p => p.isReady === true);
    if (!allReady) {
      throw new Error('Nem todos os jogadores estão prontos');
    }

    if (players.length > 0) {
      await players[0].update({ isCurrentTurn: true });
    }

    await game.update({ status: 'started' });
    return true;
  }

  /**
   * Busca um jogo pelo seu ID
   */
  async getGameById(id) {
    const game = await Game.findByPk(id);
    if (!game) throw new Error('Jogo não encontrado');
    return game;
  }

  /**
   * Atualiza os dados de um jogo
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
   */
  async deleteGame(id) {
    const game = await this.getGameById(id);
    await game.destroy();
    return { message: 'Jogo removido com sucesso' };
  }

  /**
   * Obtém as pontuações atuais
   * Corrigido para usar Result.success e Result.failure
   */
  async getScores(gameId) {
  try {
    const game = await Game.findByPk(gameId);
    if (!game) {
      return Result.failure('Jogo não encontrado');
    }

    // Busca no repositório que inclui o Player e o atributo score
    const gamePlayers = await gameRepository.getGameScores(gameId);

    if (!gamePlayers || gamePlayers.length === 0) {
      return Result.failure('Nenhum jogador encontrado neste jogo.');
    }

    const scoresMap = {};
    gamePlayers.forEach(gp => {
      // Pega o nome do Player vindo do include e a pontuação real do GamePlayer
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

  /**
   * Obtém o jogador atual
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
   * Obtém a carta do topo
   */
  async getTopCard(gameId) {
    const game = await this.getGameById(gameId);
    const discardPile = game.discardPile || [];
    if (discardPile.length === 0) throw new Error('Pilha vazia');
    return discardPile[discardPile.length - 1];
  }

  /**
   * Distribui cartas (Recursivo)
   */
  async dealCards(gameId, cardsPerPlayer = 7) {
    const game = await this.getGameById(gameId);
    const gamePlayers = await GamePlayer.findAll({
      where: { gameId },
      include: [{ model: Player, attributes: ['id', 'username'] }]
    });

    if (gamePlayers.length === 0) throw new Error('Sem jogadores');

    const playerNames = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
    const deck = this.shuffleDeck(this.createUnoDeck());

    const playerHands = this.dealCardsRecursive(playerNames, cardsPerPlayer, deck);

    for (const gamePlayer of gamePlayers) {
      const name = gamePlayer.Player ? gamePlayer.Player.username : `Player${gamePlayer.playerId}`;
      await gamePlayer.update({ hand: playerHands[name] || [] });
    }

    const firstCard = deck.pop();
    await game.update({ discardPile: [firstCard], deck: deck });

    return { message: 'Cards dealt successfully.', players: playerHands, firstCard };
  }

  /**
   * Executa a jogada de uma carta
   */
  async playCard(gameId, playerUsername, cardPlayed, chosenColor = null) {
    const game = await this.getGameById(gameId);
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await GamePlayer.findAll({
      where: { gameId },
      include: [{ model: Player, attributes: ['id', 'username'] }],
      order: [['id', 'ASC']]
    });

    const playingPlayerIndex = gamePlayers.findIndex(gp => gp.Player && gp.Player.username === playerUsername);
    const currentPlayer = gamePlayers[playingPlayerIndex];

    if (!currentPlayer || !currentPlayer.isCurrentTurn) throw new Error('Não é sua vez');

    const playerHand = currentPlayer.hand || [];
    if (!playerHand.includes(cardPlayed)) throw new Error('Carta não encontrada');

    const newHand = playerHand.filter(c => c !== cardPlayed);
    await currentPlayer.update({ hand: newHand, isCurrentTurn: false });

    const discardPile = game.discardPile || [];
    discardPile.push(cardPlayed);
    await game.update({ discardPile });

    if (newHand.length === 0) {
      await game.update({ status: 'finished' });
      return { message: 'You won!', winner: playerUsername };
    }

    const nextIndex = (playingPlayerIndex + 1) % gamePlayers.length;
    await gamePlayers[nextIndex].update({ isCurrentTurn: true });

    return { message: 'Card played successfully.', nextPlayer: gamePlayers[nextIndex].Player.username };
  }

  // Métodos Auxiliares
  createUnoDeck() {
    const deck = [];
    ['Red', 'Blue', 'Green', 'Yellow'].forEach(c => {
      for (let i = 0; i <= 9; i++) deck.push(`${c} ${i}`);
    });
    return deck;
  }

  shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  dealCardsRecursive(players, cards, deck, hands = {}, pIdx = 0, round = 0) {
    if (round >= cards) return hands;
    const p = players[pIdx];
    if (!hands[p]) hands[p] = [];
    hands[p].push(deck.pop());
    const nextP = (pIdx + 1) % players.length;
    return this.dealCardsRecursive(players, cards, deck, hands, nextP, nextP === 0 ? round + 1 : round);
  }

  *findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
    if (index >= hand.length) return;
    const card = hand[index];
    if (card.includes(topCard.split(' ')[0])) yield card;
    yield* this.findValidCardsRecursive(hand, topCard, currentColor, index + 1);
  }
}

module.exports = new GameService();