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
   * @returns {Promise<boolean>} Retorna true se sucesso
   * @throws {Error} Se jogo não estiver esperando, estiver cheio ou usuário já estiver nele
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
   * @returns {Promise<Object>} Objeto com novo status e mensagem
   * @throws {Error} Se jogo já iniciou ou usuário não está no jogo
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
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do jogador
   * @returns {Promise<boolean>} Retorna true se sucesso
   * @throws {Error} Se jogo não estiver em andamento ou usuário não estiver nele
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
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do usuário solicitante (deve ser o criador)
   * @returns {Promise<boolean>} Retorna true se sucesso
   * @throws {Error} Se usuário não for criador ou jogo não estiver em andamento
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
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Object>} Objeto com ID e status do jogo
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
   * @returns {Promise<Object>} Objeto com ID do jogo e lista de nomes de jogadores
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
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do usuário solicitante (deve ser o criador)
   * @returns {Promise<boolean>} Retorna true se sucesso
   * @throws {Error} Se não for criador, menos de 2 jogadores ou nem todos prontos
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
   * @param {number} id - ID do jogo
   * @returns {Promise<Game>} Instância do jogo
   * @throws {Error} Se jogo não for encontrado
   */
  async getGameById(id) {
    const game = await Game.findByPk(id);
    if (!game) throw new Error('Jogo não encontrado');
    return game;
  }

  /**
   * Atualiza os dados de um jogo
   * @param {number} id - ID do jogo
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Game>} Jogo atualizado
   * @throws {Error} Se tentar reduzir maxPlayers abaixo do número atual de jogadores
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
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async deleteGame(id) {
    const game = await this.getGameById(id);
    await game.destroy();
    return { message: 'Jogo removido com sucesso' };
  }

  /**
   * Obtém as pontuações atuais
   * Corrigido para usar Result.success e Result.failure
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Result>} Result com pontuações ou erro
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
   * @param {number} gameId - ID do jogo
   * @returns {Promise<string>} Nome do usuário do jogador atual
   * @throws {Error} Se não houver jogador atual
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
   * @param {number} gameId - ID do jogo
   * @returns {Promise<string>} String representando a carta
   * @throws {Error} Se pilha estiver vazia
   */
  async getTopCard(gameId) {
    const game = await this.getGameById(gameId);
    const discardPile = game.discardPile || [];
    if (discardPile.length === 0) throw new Error('Pilha vazia');
    return discardPile[discardPile.length - 1];
  }

  /**
   * Distribui cartas (Recursivo)
   * @param {number} gameId - ID do jogo
   * @param {number} [cardsPerPlayer=7] - Número de cartas por jogador
   * @returns {Promise<Object>} Resultado da distribuição
   * @throws {Error} Se não houver jogadores
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
   * @param {number} gameId - ID do jogo
   * @param {string} playerUsername - Nome do usuário que está jogando
   * @param {string} cardPlayed - Carta sendo jogada
   * @param {string} [chosenColor] - Cor escolhida (para cartas curinga)
   * @returns {Promise<Object>} Resultado da jogada
   * @throws {Error} Vários erros de validação de regra de negócio
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

  /**
   * Cria um baralho completo de UNO (Restaurado)
   * @returns {string[]} Array contendo as cartas do baralho
   */
  createUnoDeck() {
    const deck = [];
    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const actions = ['Skip', 'Reverse', 'Draw Two'];

    colors.forEach(color => {
      deck.push(`${color} 0`);
      numbers.slice(1).forEach(number => {
        deck.push(`${color} ${number}`);
        deck.push(`${color} ${number}`);
      });
      actions.forEach(action => {
        deck.push(`${color} ${action}`);
        deck.push(`${color} ${action}`);
      });
    });

    for (let i = 0; i < 4; i++) {
      deck.push('Wild');
      deck.push('Wild Draw Four');
    }

    return deck;
  }

  /**
   * Embaralha um array (Algoritmo Fisher-Yates)
   * @param {Array} array - O array a ser embaralhado
   * @returns {Array} O array embaralhado
   */
  shuffleDeck(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Distribui cartas recursivamente
   * @param {string[]} players - Lista de nomes dos jogadores
   * @param {number} cards - Número total de cartas a distribuir por jogador
   * @param {string[]} deck - O baralho atual
   * @param {Object} [hands={}] - Objeto acumulador das mãos (uso interno da recursão)
   * @param {number} [pIdx=0] - Índice do jogador atual (uso interno)
   * @param {number} [round=0] - Rodada atual de distribuição (uso interno)
   * @returns {Object} Mapa com as mãos dos jogadores (chave: nome, valor: array de cartas)
   */
  dealCardsRecursive(players, cards, deck, hands = {}, pIdx = 0, round = 0) {
    if (round >= cards) return hands;
    const p = players[pIdx];
    if (!hands[p]) hands[p] = [];
    if (deck.length > 0) {
        hands[p].push(deck.pop());
    }
    const nextP = (pIdx + 1) % players.length;
    const nextRound = nextP === 0 ? round + 1 : round;
    return this.dealCardsRecursive(players, cards, deck, hands, nextP, nextRound);
  }

  /**
   * Encontra cartas válidas recursivamente (Generator)
   * @param {string[]} hand - Mão do jogador
   * @param {string} topCard - Carta do topo da pilha de descarte
   * @param {string} currentColor - Cor atual do jogo
   * @param {number} [index=0] - Índice atual da iteração na mão (uso interno)
   * @yields {string} A próxima carta válida encontrada na mão
   */
  *findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
    if (index >= hand.length) return;
    
    const card = hand[index];
    const topParts = topCard.split(' ');
    const cardParts = card.split(' ');

    // Lógica simplificada de validade (cor ou valor/ação igual, ou Wild)
    const isWild = cardParts[0] === 'Wild';
    const sameColor = cardParts[0] === (currentColor || topParts[0]);
    const sameValue = cardParts[1] && cardParts[1] === topParts[1];

    if (isWild || sameColor || sameValue) {
        yield card;
    }
    
    yield* this.findValidCardsRecursive(hand, topCard, currentColor, index + 1);
  }
}

module.exports = new GameService();