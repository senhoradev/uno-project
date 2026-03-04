/**
 * @fileoverview Serviço responsável pela lógica de negócio dos jogos
 * @module services/gameService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');
const Card = require('../models/card');
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
    const topCard = discardPile[discardPile.length - 1];
    return topCard;
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
    const deckStrings = this.shuffleDeck(this.createUnoDeck());

    // Remove cartas anteriores deste jogo na tabela Card
    await Card.destroy({ where: { gameId } });

    // Salva todas as cartas na tabela Card
    const cardDataArray = deckStrings.map(name => {
      const parts = name.split(' ');
      const color = parts[0]; // "Red", "Blue", "Wild", etc.
      const action = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]; // "7", "Skip", "Draw Four"
      return { color, action, gameId };
    });
    await Card.bulkCreate(cardDataArray);

    // Busca as cartas salvas com IDs reais do banco
    const savedCards = await Card.findAll({ where: { gameId }, order: [['id', 'ASC']] });

    // Cria deck de objetos { id, name } com IDs do banco
    const deck = savedCards.map((record, i) => ({
      id: record.id,
      name: deckStrings[i]
    }));

    // Distribui cartas usando recursão (deck é modificado in-place via pop)
    const playerHands = this.dealCardsRecursive(playerNames, cardsPerPlayer, deck);

    // Salva as mãos dos jogadores
    for (const gamePlayer of gamePlayers) {
      const name = gamePlayer.Player ? gamePlayer.Player.username : `Player${gamePlayer.playerId}`;
      await gamePlayer.update({ hand: playerHands[name] || [] });
    }

    // Primeira carta vai para a pilha de descarte
    const firstCard = deck.pop();

    // Restante fica no deck do jogo
    await game.update({ discardPile: [firstCard], deck: deck });

    return { message: 'Cards dealt successfully.', players: playerHands, firstCard };
  }

  /**
   * Recupera os dados reais da partida no banco de dados
   * @param {number} gameId 
   */
  async getLiveGameContext(gameId) {
    const game = await this.getGameById(gameId);
    const gamePlayers = await GamePlayer.findAll({
      where: { gameId },
      include: [{ model: Player, attributes: ['username', 'id'] }],
      order: [['id', 'ASC']] // Mantém a ordem de entrada dos jogadores
    });

    const playersNames = gamePlayers.map(gp => gp.Player.username);
    const currentIndex = gamePlayers.findIndex(gp => gp.isCurrentTurn === true);

    if (currentIndex === -1) throw new Error('Turno atual não configurado para este jogo');

    return { game, gamePlayers, playersNames, currentIndex };
  }

  /**
   * Lógica principal: Processa a jogada e atualiza o turno no DB
   */
  async advanceTurnInDb(gameId, cardPlayed = null) {
    const { game, gamePlayers, playersNames, currentIndex } = await this.getLiveGameContext(gameId);

    // Recupera direção atual salva no jogo (ou padrão)
    const currentDirection = game.direction || "clockwise";

    // Calcula o próximo estado usando a lógica unificada
    const result = await this.processCardLogic(
      cardPlayed || "normal",
      currentIndex,
      playersNames,
      currentDirection
    );

    // 1. Se a direção mudou (Reverse), salva no jogo
    if (result.newDirection !== currentDirection) {
      await game.update({ direction: result.newDirection });
    }

    // 2. Transfere o turno no banco de dados
    await GamePlayer.update({ isCurrentTurn: false }, { where: { gameId } });
    await gamePlayers[result.nextPlayerIndex].update({ isCurrentTurn: true });

    return result;
  }

  /**
 * Lógica para jogar carta, incluindo verificação de carta de pulo (Skip)
 * @param {string} cardPlayed - A carta jogada
 * @param {number} currentPlayerIndex - Índice do jogador atual
 * @param {string[]} players - Lista de jogadores
 * @param {string} direction - Direção do jogo (padrão: "clockwise")
 */
  async playCardWithSkip(cardPlayed, currentPlayerIndex, players, direction = "clockwise") {
    const isSkipCard = cardPlayed.toLowerCase().includes('skip');
    const totalPlayers = players.length;

    // Define o passo (1 para horário, -1 para anti-horário se implementado futuramente)
    const step = direction === "clockwise" ? 1 : -1;

    // Jogador que seria o próximo normalmente
    const skippedIndex = (currentPlayerIndex + step + totalPlayers) % totalPlayers;

    let nextPlayerIndex;

    if (isSkipCard) {
      // Se for Skip, o próximo é o "depois do próximo"
      nextPlayerIndex = (skippedIndex + step + totalPlayers) % totalPlayers;
    } else {
      nextPlayerIndex = skippedIndex;
    }

    return {
      nextPlayerIndex: nextPlayerIndex,
      nextPlayer: players[nextPlayerIndex],
      skippedPlayer: isSkipCard ? players[skippedIndex] : null
    };
  }

  /**
 * Lógica para jogar carta, incluindo verificação de carta de inversão (Reverse)
 * @param {string} cardPlayed - A carta jogada
 * @param {number} currentPlayerIndex - Índice do jogador atual
 * @param {string[]} players - Lista de jogadores
 * @param {string} direction - Direção atual ("clockwise" ou "counterclockwise")
 */
  async playCardWithReverse(cardPlayed, currentPlayerIndex, players, direction = "clockwise") {
    const isReverseCard = cardPlayed.toLowerCase().includes('reverse');
    const totalPlayers = players.length;

    // Inverte a direção se for uma carta Reverse
    let newDirection = direction;
    if (isReverseCard) {
      newDirection = direction === "clockwise" ? "counterclockwise" : "clockwise";
    }

    // Define o passo com base na nova direção
    // Clockwise: +1 | Counterclockwise: -1
    const step = newDirection === "clockwise" ? 1 : -1;

    // Calcula o próximo índice de forma cíclica
    // Somamos totalPlayers para garantir que o resultado seja positivo em subtrações
    const nextPlayerIndex = (currentPlayerIndex + step + totalPlayers) % totalPlayers;

    return {
      newDirection: newDirection,
      nextPlayerIndex: nextPlayerIndex,
      nextPlayer: players[nextPlayerIndex]
    };
  }

  /**
   * Lógica unificada para tratar Skip, Reverse e Avanço Normal
   */
  async processCardLogic(cardPlayed, currentIndex, players, direction) {
    const card = cardPlayed.toLowerCase();
    const isSkip = card.includes('skip');
    const isReverse = card.includes('reverse');
    const total = players.length;

    let newDirection = direction;
    if (isReverse) {
      newDirection = direction === "clockwise" ? "counterclockwise" : "clockwise";
    }

    const step = newDirection === "clockwise" ? 1 : -1;
    const normalNextIndex = (currentIndex + step + total) % total;

    let nextPlayerIndex;
    let skippedPlayer = null;

    if (isSkip) {
      skippedPlayer = players[normalNextIndex];
      nextPlayerIndex = (normalNextIndex + step + total) % total;
    } else {
      nextPlayerIndex = normalNextIndex;
    }

    return {
      newDirection,
      nextPlayerIndex,
      nextPlayer: players[nextPlayerIndex],
      skippedPlayer
    };
  }

  /**
 * Processa a compra de carta persistindo no banco de dados
 */
  async drawCardInDb(gameId, userId) {
    // Busca o contexto do jogo e dos jogadores
    const { game, gamePlayers } = await this.getLiveGameContext(gameId);
    const gamePlayer = gamePlayers.find(gp => gp.playerId === userId);

    if (!gamePlayer || !gamePlayer.isCurrentTurn) {
      throw new Error("Não é sua vez de jogar ou você não está neste jogo.");
    }

    const deck = game.deck || [];
    const discardPile = game.discardPile || [];
    const topCardObj = discardPile[discardPile.length - 1];
    const topCardName = topCardObj ? (topCardObj.name || topCardObj) : "";

    // Executa a lógica de compra (utiliza o método que já definimos)
    const result = await this.drawUntilPlayable(gamePlayer.hand, deck, topCardName);

    // Atualiza o baralho do jogo e a mão do jogador no Banco de Dados
    // Importante: No Sequelize, campos JSON devem ser atribuídos novamente para disparar o update
    await game.update({ deck: deck });
    await gamePlayer.update({ hand: result.newHand });

    return result;
  }
  /**
   * Lógica de compra
   */
  async drawUntilPlayable(playerHand, deck, currentCard) {
    let newHand = [...playerHand];
    let drawnCard = null;
    let playable = false;

    if (deck.length > 0) {
      drawnCard = deck.shift();
      newHand.push(drawnCard);

      // Suporta cartas como objetos { id, name } ou strings
      const drawnCardName = (drawnCard.name || drawnCard).toString();
      const currentCardName = (currentCard.name || currentCard).toString();

      const topParts = currentCardName.toLowerCase().split(/[ _]/);
      const drawnParts = drawnCardName.toLowerCase().split(/[ _]/);

      const sameColor = drawnParts[0] === topParts[0];
      const sameValue = drawnParts[1] && drawnParts[1] === topParts[1];
      const isWild = drawnParts[0].includes('wild');

      if (sameColor || sameValue || isWild) {
        playable = true;
      }
    }

    return { newHand, drawnCard, playable };
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

    const playersNames = gamePlayers.map(gp => gp.Player.username);
    const playingPlayerIndex = gamePlayers.findIndex(gp => gp.Player && gp.Player.username === playerUsername);
    const currentPlayer = gamePlayers[playingPlayerIndex];

    if (!currentPlayer || !currentPlayer.isCurrentTurn) throw new Error('Não é sua vez');

    const playerHand = currentPlayer.hand || [];
    // Suporta cartas como objetos { id, name } ou strings
    const cardIndex = playerHand.findIndex(c => {
      const cardName = c.name || c;
      return cardName === cardPlayed;
    });
    if (cardIndex === -1) throw new Error('Carta não encontrada na mão');

    // Valida se a carta pode ser jogada (mesma cor, mesmo valor, ou Wild)
    const discardPile = game.discardPile || [];
    const topCardObj = discardPile[discardPile.length - 1];
    const topCardName = topCardObj ? (topCardObj.name || topCardObj) : '';

    const cardLower = cardPlayed.toLowerCase();
    const topLower = topCardName.toLowerCase();
    const isWild = cardLower.startsWith('wild');

    if (!isWild && topCardName) {
      const cardParts = cardPlayed.split(' ');
      const topParts = topCardName.split(' ');
      const activeColor = (game.currentColor || topParts[0]).toLowerCase();
      const sameColor = cardParts[0].toLowerCase() === activeColor;
      const sameValue = cardParts.slice(1).join(' ') === topParts.slice(1).join(' ');

      if (!sameColor && !sameValue) {
        throw new Error('Invalid card. Please play a card that matches the top card on the discard pile.');
      }
    }

    // Se é Wild, chosenColor é obrigatório
    if (isWild && !chosenColor) {
      throw new Error('chosenColor é obrigatório para cartas Wild (Red, Blue, Green, Yellow)');
    }

    // Remove a carta da mão
    const playedCardObj = playerHand[cardIndex];
    const newHand = playerHand.filter((_, i) => i !== cardIndex);
    await currentPlayer.update({ hand: newHand, isCurrentTurn: false });

    // Adiciona à pilha de descarte
    discardPile.push(playedCardObj);
    const updateData = { discardPile };

    // Se é Wild, salva a cor escolhida
    if (isWild && chosenColor) {
      updateData.currentColor = chosenColor;
    } else {
      // Limpa currentColor para usar a cor da carta jogada
      updateData.currentColor = null;
    }

    // Verifica vitória
    if (newHand.length === 0) {
      updateData.status = 'finished';
      await game.update(updateData);
      return { message: 'You won!', winner: playerUsername };
    }

    // Usa processCardLogic para calcular próximo jogador (Skip, Reverse)
    const currentDirection = game.direction || 'clockwise';
    const turnResult = await this.processCardLogic(
      cardPlayed, playingPlayerIndex, playersNames, currentDirection
    );

    // Se a direção mudou (Reverse), salva
    if (turnResult.newDirection !== currentDirection) {
      updateData.direction = turnResult.newDirection;
    }

    await game.update(updateData);

    // Transfere o turno
    await GamePlayer.update({ isCurrentTurn: false }, { where: { gameId } });
    await gamePlayers[turnResult.nextPlayerIndex].update({ isCurrentTurn: true });

    // Draw Two: próximo jogador compra 2 cartas
    if (cardLower.includes('draw two')) {
      const nextPlayer = gamePlayers[turnResult.nextPlayerIndex];
      const gameDeck = game.deck || [];
      const nextHand = nextPlayer.hand || [];
      for (let i = 0; i < 2 && gameDeck.length > 0; i++) {
        nextHand.push(gameDeck.shift());
      }
      await nextPlayer.update({ hand: nextHand });
      await game.update({ deck: gameDeck });
    }

    // Wild Draw Four: próximo jogador compra 4 cartas
    if (cardLower.includes('wild draw four')) {
      const nextPlayer = gamePlayers[turnResult.nextPlayerIndex];
      const gameDeck = game.deck || [];
      const nextHand = nextPlayer.hand || [];
      for (let i = 0; i < 4 && gameDeck.length > 0; i++) {
        nextHand.push(gameDeck.shift());
      }
      await nextPlayer.update({ hand: nextHand });
      await game.update({ deck: gameDeck });
    }

    return {
      message: 'Card played successfully.',
      cardPlayed: cardPlayed,
      nextPlayer: playersNames[turnResult.nextPlayerIndex],
      direction: turnResult.newDirection,
      skippedPlayer: turnResult.skippedPlayer,
      remainingCards: newHand.length,
      currentColor: isWild ? chosenColor : null
    };
  }

  /**
   * Gera um baralho completo de UNO com 108 cartas.
   * Estrutura: 4 cores (Red, Blue, Green, Yellow) com cartas 0-9, Ações e Curingas.
   * @returns {string[]} Array de strings representando as cartas (ex: "Red 7", "Blue Skip", "Wild")
   */
  createUnoDeck() {
    const deck = [];
    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const actions = ['Skip', 'Reverse', 'Draw Two'];

    // Para cada cor, gera as cartas numéricas e de ação
    colors.forEach(color => {
      deck.push(`${color} 0`); // Apenas um '0' por cor

      // Duas cartas de cada número (1-9) por cor
      numbers.slice(1).forEach(number => {
        deck.push(`${color} ${number}`);
        deck.push(`${color} ${number}`);
      });

      // Duas cartas de cada ação por cor
      actions.forEach(action => {
        deck.push(`${color} ${action}`);
        deck.push(`${color} ${action}`);
      });
    });

    // Adiciona as cartas Curinga (4 de cada tipo)
    for (let i = 0; i < 4; i++) {
      deck.push('Wild');
      deck.push('Wild Draw Four');
    }

    return deck;
  }

  /**
   * Embaralha as cartas usando o algoritmo Fisher-Yates.
   * Garante uma permutação aleatória e imparcial do baralho.
   * @param {string[]} array - O baralho a ser embaralhado
   * @returns {string[]} O baralho embaralhado
   */
  shuffleDeck(array) {
    const shuffled = [...array];
    // Percorre o array de trás para frente
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Escolhe um índice aleatório anterior ao atual
      const j = Math.floor(Math.random() * (i + 1));
      // Troca os elementos de posição
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Distribui cartas aos jogadores de forma circular (Round-Robin) usando recursão.
   * @param {string[]} players - Lista de nomes dos jogadores
   * @param {number} cards - Número total de cartas a distribuir por jogador
   * @param {string[]} deck - O baralho atual
   * @param {Object} [hands={}] - Acumulador das mãos (chave: nome, valor: array de cartas)
   * @param {number} [pIdx=0] - Índice do jogador atual recebendo a carta
   * @param {number} [round=0] - Contador de cartas distribuídas por jogador
   * @returns {Object} Mapa com as mãos dos jogadores (chave: nome, valor: array de cartas)
   */
  dealCardsRecursive(players, cards, deck, hands = {}, pIdx = 0, round = 0) {
    // Caso base: se atingiu o número de cartas por jogador, encerra a recursão
    if (round >= cards) return hands;

    const p = players[pIdx];

    // Inicializa a mão do jogador se não existir
    if (!hands[p]) hands[p] = [];

    // Retira uma carta do baralho e entrega ao jogador atual
    if (deck.length > 0) {
      hands[p].push(deck.pop());
    }

    // Calcula o próximo jogador e verifica se completou uma rodada de distribuição
    const nextP = (pIdx + 1) % players.length;
    const nextRound = nextP === 0 ? round + 1 : round;

    return this.dealCardsRecursive(players, cards, deck, hands, nextP, nextRound);
  }

  /**
   * Identifica quais cartas na mão do jogador são jogáveis com base na carta do topo.
   * Utiliza um Generator Function para processar a mão item a item de forma preguiçosa (lazy).
   * 
   * @param {string[]} hand - Mão do jogador
   * @param {string} topCard - Carta do topo da pilha de descarte
   * @param {string} currentColor - Cor atual do jogo
   * @param {number} [index=0] - Índice atual da iteração na mão
   * @yields {string} A próxima carta válida encontrada
   */
  *findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
    // Caso base: fim do array
    if (index >= hand.length) return;

    const card = hand[index];
    // Suporta cartas como objetos { id, name } ou strings
    const cardName = (card.name || card).toString();
    const topCardName = (topCard.name || topCard).toString();
    const topParts = topCardName.split(' ');
    const cardParts = cardName.split(' ');

    // Regras de validação:
    // 1. É carta curinga (Wild)
    // 2. Mesma cor da carta do topo (ou da cor escolhida anteriormente)
    // 3. Mesmo valor ou símbolo (ex: 7 com 7, Skip com Skip)
    const isWild = cardParts[0] === 'Wild';
    const sameColor = cardParts[0] === (currentColor || topParts[0]);
    const sameValue = cardParts[1] && cardParts[1] === topParts[1];

    if (isWild || sameColor || sameValue) {
      yield card;
    }

    // Chamada recursiva para o próximo índice (yield* delega para o próximo generator)
    yield* this.findValidCardsRecursive(hand, topCard, currentColor, index + 1);
  }
}

module.exports = new GameService();