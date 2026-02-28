/**
 * @fileoverview Serviço responsável pela lógica de negócio dos jogos UNO
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

  // ========================================================
  // LOBBY / LIFECYCLE METHODS (mantidos da implementação original)
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
   * Inicia o jogo - configura turnOrder para cada jogador
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
   * Obtém as pontuações atuais (usando Result Monad)
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

  // ========================================================
  // HELPERS: Busca de jogadores ordenados por turno
  // ========================================================

  /**
   * Retorna os jogadores do jogo ordenados por turnOrder (ASC)
   * @param {number} gameId
   * @returns {Promise<GamePlayer[]>}
   */
  async getOrderedPlayers(gameId) {
    return GamePlayer.findAll({
      where: { gameId },
      include: [{ model: Player, attributes: ['id', 'username'] }],
      order: [['turnOrder', 'ASC']]
    });
  }

  /**
   * Calcula o índice do próximo jogador com base na direção.
   * @param {number} currentIndex - índice atual
   * @param {number} direction - 1 ou -1
   * @param {number} totalPlayers - total de jogadores
   * @param {number} [skip=1] - quantas posições avançar (2 para Skip)
   * @returns {number} próximo índice
   */
  getNextPlayerIndex(currentIndex, direction, totalPlayers, skip = 1) {
    return ((currentIndex + direction * skip) % totalPlayers + totalPlayers) % totalPlayers;
  }

  /**
   * Avança o turno para o próximo jogador e atualiza isCurrentTurn de todos.
   * @param {GamePlayer[]} gamePlayers - lista ordenada
   * @param {number} nextIndex - índice do próximo
   */
  async advanceTurn(gamePlayers, nextIndex) {
    for (const gp of gamePlayers) {
      const shouldBeCurrent = gp.turnOrder === nextIndex;
      if (gp.isCurrentTurn !== shouldBeCurrent) {
        await gp.update({ isCurrentTurn: shouldBeCurrent });
      }
    }
  }

  /**
   * Reaproveita a pilha de descarte como baralho quando o deck fica vazio.
   * Mantém a última carta na pilha de descarte.
   * @param {Game} game
   * @returns {Promise<string[]>} novo deck embaralhado
   */
  async reshuffleDeckFromDiscard(game) {
    const discardPile = [...(game.discardPile || [])];
    const topCard = discardPile.pop(); // mantém a última carta
    const newDeck = this.shuffleDeck(discardPile);
    await game.update({ deck: newDeck, discardPile: [topCard] });
    return newDeck;
  }

  // ========================================================
  // 1. DISTRIBUIÇÃO DE CARTAS (RECURSIVA)
  // ========================================================

  /**
   * Distribui cartas aos jogadores usando recursão.
   * Cria um baralho UNO completo, embaralha, distribui recursivamente,
   * coloca a primeira carta válida (não-Wild) na pilha de descarte.
   *
   * @param {number} gameId - ID do jogo
   * @param {number} [cardsPerPlayer=7] - Número de cartas por jogador
   * @returns {Promise<Object>} Resultado da distribuição
   */
  async dealCards(gameId, cardsPerPlayer = 7) {
    const game = await this.getGameById(gameId);
    const gamePlayers = await this.getOrderedPlayers(gameId);

    if (gamePlayers.length === 0) throw new Error('Sem jogadores');

    const playerNames = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
    const deck = this.shuffleDeck(this.createUnoDeck());

    // Distribui recursivamente
    const playerHands = this.dealCardsRecursive(playerNames, cardsPerPlayer, deck);

    // Persiste a mão de cada jogador e reseta saidUno
    for (const gamePlayer of gamePlayers) {
      const name = gamePlayer.Player ? gamePlayer.Player.username : `Player${gamePlayer.playerId}`;
      await gamePlayer.update({ hand: playerHands[name] || [], saidUno: false });
    }

    // Primeira carta da pilha de descarte deve ser uma carta numérica (não Wild, não ação)
    let firstCard = this.drawFirstValidCard(deck);

    // Define a cor atual baseada na primeira carta
    const firstCardParts = firstCard.split(' ');
    const firstColor = firstCardParts[0]; // Red, Blue, Green, Yellow

    await game.update({ 
      discardPile: [firstCard], 
      deck: deck, 
      currentColor: firstColor,
      direction: 1,
      currentPlayerIndex: 0,
      drawPenalty: 0
    });

    return { message: 'Cards dealt successfully.', players: playerHands, firstCard };
  }

  /**
   * Retira a primeira carta válida (numérica, não-Wild) para iniciar a pilha de descarte.
   * Se todas forem Wild/ação, aceita qualquer carta colorida.
   * @param {string[]} deck - deck mutável (modifica in-place)
   * @returns {string} carta inicial
   */
  drawFirstValidCard(deck) {
    // Procura uma carta numérica (ex: "Red 3") - evita Wild e ações
    for (let i = deck.length - 1; i >= 0; i--) {
      const card = deck[i];
      const parts = card.split(' ');
      // Carta numérica: tem 2 partes, primeira é cor, segunda é número 0-9
      if (parts.length === 2 && ['Red','Blue','Green','Yellow'].includes(parts[0]) && /^[0-9]$/.test(parts[1])) {
        deck.splice(i, 1);
        return card;
      }
    }
    // Fallback: qualquer carta com cor
    for (let i = deck.length - 1; i >= 0; i--) {
      const card = deck[i];
      if (!card.startsWith('Wild')) {
        deck.splice(i, 1);
        return card;
      }
    }
    // Último recurso
    return deck.pop();
  }

  // ========================================================
  // 2. JOGAR CARTA SEGUINDO AS REGRAS
  // ========================================================

  /**
   * Verifica se uma carta é válida para ser jogada sobre a carta do topo.
   * @param {string} card - carta a jogar
   * @param {string} topCard - carta do topo da pilha
   * @param {string} currentColor - cor corrente do jogo (pode diferir da topCard se foi Wild)
   * @returns {boolean}
   */
  isCardValid(card, topCard, currentColor) {
    if (card.startsWith('Wild')) return true;

    const cardParts = card.split(' ');
    const topParts = topCard.split(' ');

    const cardColor = cardParts[0];
    const cardValue = cardParts.slice(1).join(' '); // "Draw Two", "Skip", "Reverse", ou número

    const topValue = topParts[0] === 'Wild' ? null : topParts.slice(1).join(' ');

    // Mesma cor (comparar com currentColor, não com a cor literal da topCard se foi Wild)
    if (cardColor === currentColor) return true;

    // Mesmo valor/ação
    if (topValue && cardValue === topValue) return true;

    return false;
  }

  /**
   * Joga uma carta seguindo todas as regras do UNO:
   * - Valida turno do jogador
   * - Valida se a carta é compatível (cor, número/ação, ou Wild)
   * - Aplica efeitos de cartas de ação (Skip, Reverse, Draw Two, Wild, Wild Draw Four)
   * - Gerencia troca de turno respeitando direção
   * - Detecta vitória quando mão fica vazia
   *
   * @param {number} gameId
   * @param {string} playerUsername
   * @param {string} cardPlayed - string da carta, ex: "Red 7", "Wild Draw Four"
   * @param {string} [chosenColor] - cor escolhida ao jogar Wild
   * @returns {Promise<Object>} resultado da jogada
   */
  async playCard(gameId, playerUsername, cardPlayed, chosenColor = null) {
    const game = await this.getGameById(gameId);
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await this.getOrderedPlayers(gameId);
    const totalPlayers = gamePlayers.length;

    // Encontra o jogador que está tentando jogar
    const currentGP = gamePlayers.find(gp => gp.Player && gp.Player.username === playerUsername);
    if (!currentGP) throw new Error('Jogador não encontrado neste jogo');
    if (!currentGP.isCurrentTurn) throw new Error('Não é sua vez');

    // Verifica se a carta está na mão
    const playerHand = [...(currentGP.hand || [])];
    const cardIndex = playerHand.indexOf(cardPlayed);
    if (cardIndex === -1) throw new Error('Carta não encontrada na mão');

    // Valida carta contra a pilha de descarte
    const discardPile = [...(game.discardPile || [])];
    const topCard = discardPile[discardPile.length - 1];
    const currentColor = game.currentColor || topCard.split(' ')[0];

    if (!this.isCardValid(cardPlayed, topCard, currentColor)) {
      throw new Error('Invalid card. Please play a card that matches the top card on the discard pile.');
    }

    // Valida que Wild requer chosenColor
    if (cardPlayed.startsWith('Wild') && !chosenColor) {
      throw new Error('Você deve escolher uma cor ao jogar uma carta Wild.');
    }
    if (chosenColor && !['Red', 'Blue', 'Green', 'Yellow'].includes(chosenColor)) {
      throw new Error('Cor inválida. Escolha entre: Red, Blue, Green, Yellow.');
    }

    // Remove carta da mão
    playerHand.splice(cardIndex, 1);

    // Atualiza pilha de descarte
    discardPile.push(cardPlayed);

    // Determina nova cor
    let newColor;
    if (cardPlayed.startsWith('Wild')) {
      newColor = chosenColor;
    } else {
      newColor = cardPlayed.split(' ')[0];
    }

    // Reseta saidUno se jogador tinha dito e agora tem mais de 1 carta
    let saidUno = currentGP.saidUno;
    if (playerHand.length !== 1) {
      saidUno = false;
    }

    // Atualiza a mão do jogador
    await currentGP.update({ hand: playerHand, isCurrentTurn: false, saidUno });

    // Verifica vitória (mão vazia)
    if (playerHand.length === 0) {
      await game.update({ discardPile, currentColor: newColor, status: 'finished' });
      return { 
        message: `${playerUsername} played ${cardPlayed}. ${playerUsername} wins!`, 
        winner: playerUsername 
      };
    }

    // Aplica efeitos de cartas de ação
    let direction = game.direction;
    let currentIndex = game.currentPlayerIndex;
    let drawPenalty = game.drawPenalty || 0;
    const cardValue = cardPlayed.startsWith('Wild') 
      ? (cardPlayed === 'Wild Draw Four' ? 'Draw Four' : null)
      : cardPlayed.split(' ').slice(1).join(' ');

    let skippedPlayer = null;
    let nextIndex;

    if (cardValue === 'Reverse') {
      // Inverte a direção
      direction *= -1;
      if (totalPlayers === 2) {
        // Com 2 jogadores, Reverse funciona como Skip
        nextIndex = currentIndex; // mesmo jogador joga novamente
      } else {
        nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
      }
    } else if (cardValue === 'Skip') {
      // Pula o próximo jogador
      const skippedIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
      skippedPlayer = gamePlayers[skippedIndex].Player 
        ? gamePlayers[skippedIndex].Player.username 
        : `Player${gamePlayers[skippedIndex].playerId}`;
      nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers, 2);
    } else if (cardValue === 'Draw Two') {
      // Próximo jogador compra 2 cartas e perde o turno
      const penaltyIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
      const penaltyPlayer = gamePlayers[penaltyIndex];
      const penaltyHand = [...(penaltyPlayer.hand || [])];
      let deck = [...(game.deck || [])];

      for (let i = 0; i < 2; i++) {
        if (deck.length === 0) {
          deck = await this.reshuffleDeckFromDiscard(game);
        }
        if (deck.length > 0) {
          penaltyHand.push(deck.pop());
        }
      }

      await penaltyPlayer.update({ hand: penaltyHand, saidUno: false });
      // Atualiza deck no game antes de continuar
      await game.update({ deck });

      skippedPlayer = penaltyPlayer.Player 
        ? penaltyPlayer.Player.username 
        : `Player${penaltyPlayer.playerId}`;
      nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers, 2);
    } else if (cardValue === 'Draw Four') {
      // Wild Draw Four: próximo jogador compra 4 e perde turno
      const penaltyIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
      const penaltyPlayer = gamePlayers[penaltyIndex];
      const penaltyHand = [...(penaltyPlayer.hand || [])];
      let deck = [...(game.deck || [])];

      for (let i = 0; i < 4; i++) {
        if (deck.length === 0) {
          deck = await this.reshuffleDeckFromDiscard(game);
        }
        if (deck.length > 0) {
          penaltyHand.push(deck.pop());
        }
      }

      await penaltyPlayer.update({ hand: penaltyHand, saidUno: false });
      await game.update({ deck });

      skippedPlayer = penaltyPlayer.Player 
        ? penaltyPlayer.Player.username 
        : `Player${penaltyPlayer.playerId}`;
      nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers, 2);
    } else {
      // Carta normal (número ou Wild sem efeito especial)
      nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
    }

    // Persiste estado do jogo
    await game.update({ 
      discardPile, 
      currentColor: newColor, 
      direction, 
      currentPlayerIndex: nextIndex 
    });

    // Avança o turno
    await this.advanceTurn(gamePlayers, nextIndex);

    const nextPlayerName = gamePlayers[nextIndex].Player 
      ? gamePlayers[nextIndex].Player.username 
      : `Player${gamePlayers[nextIndex].playerId}`;

    const response = { 
      message: `Card played successfully.`, 
      cardPlayed,
      nextPlayer: nextPlayerName,
      remainingCards: playerHand.length
    };

    if (skippedPlayer) {
      response.skippedPlayer = skippedPlayer;
    }

    if (playerHand.length === 1) {
      response.warning = `${playerUsername} has UNO! (1 card left)`;
    }

    return response;
  }

  // ========================================================
  // 3. COMPRAR CARTA DO BARALHO
  // ========================================================

  /**
   * O jogador compra uma carta do baralho (quando não pode jogar).
   * O turno passa para o próximo jogador.
   *
   * @param {number} gameId
   * @param {string} playerUsername
   * @returns {Promise<Object>} resultado com a carta comprada
   */
  async drawCard(gameId, playerUsername) {
    const game = await this.getGameById(gameId);
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await this.getOrderedPlayers(gameId);
    const totalPlayers = gamePlayers.length;

    const currentGP = gamePlayers.find(gp => gp.Player && gp.Player.username === playerUsername);
    if (!currentGP) throw new Error('Jogador não encontrado neste jogo');
    if (!currentGP.isCurrentTurn) throw new Error('Não é sua vez');

    let deck = [...(game.deck || [])];

    // Se o deck está vazio, reembaralha a pilha de descarte
    if (deck.length === 0) {
      deck = await this.reshuffleDeckFromDiscard(game);
    }

    if (deck.length === 0) {
      throw new Error('Não há cartas disponíveis para comprar.');
    }

    const drawnCard = deck.pop();
    const playerHand = [...(currentGP.hand || []), drawnCard];

    // Reseta saidUno pois agora tem mais cartas
    await currentGP.update({ hand: playerHand, isCurrentTurn: false, saidUno: false });

    // Avança turno
    const direction = game.direction;
    const currentIndex = game.currentPlayerIndex;
    const nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);

    await game.update({ deck, currentPlayerIndex: nextIndex });
    await this.advanceTurn(gamePlayers, nextIndex);

    const nextPlayerName = gamePlayers[nextIndex].Player 
      ? gamePlayers[nextIndex].Player.username 
      : `Player${gamePlayers[nextIndex].playerId}`;

    return { 
      message: `${playerUsername} drew a card from the deck.`,
      cardDrawn: drawnCard,
      nextPlayer: nextPlayerName
    };
  }

  // ========================================================
  // 4. DIZER "UNO"
  // ========================================================

  /**
   * Jogador declara "UNO" quando tem exatamente 1 carta restante.
   * Deve ser chamado DEPOIS de jogar a penúltima carta (ficando com 1).
   *
   * @param {number} gameId
   * @param {string} playerUsername
   * @returns {Promise<Object>} resultado
   */
  async sayUno(gameId, playerUsername) {
    const game = await this.getGameById(gameId);
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await this.getOrderedPlayers(gameId);
    const currentGP = gamePlayers.find(gp => gp.Player && gp.Player.username === playerUsername);

    if (!currentGP) throw new Error('Jogador não encontrado neste jogo');

    const playerHand = currentGP.hand || [];

    if (playerHand.length !== 1) {
      throw new Error('Você só pode dizer UNO quando tiver exatamente 1 carta.');
    }

    if (currentGP.saidUno) {
      throw new Error('Você já disse UNO.');
    }

    await currentGP.update({ saidUno: true });

    return { message: `${playerUsername} said UNO successfully.` };
  }

  // ========================================================
  // 5. DESAFIAR JOGADOR QUE NÃO DISSE "UNO"
  // ========================================================

  /**
   * Um jogador desafia outro que tem 1 carta e não disse UNO.
   * Se o desafio for bem-sucedido, o jogador desafiado compra 2 cartas.
   * Se o desafio falhar (ele disse UNO a tempo), retorna erro.
   *
   * @param {number} gameId
   * @param {string} challengerUsername - quem está desafiando
   * @param {string} challengedUsername - quem está sendo desafiado
   * @returns {Promise<Object>} resultado do desafio
   */
  async challengeUno(gameId, challengerUsername, challengedUsername) {
    const game = await this.getGameById(gameId);
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await this.getOrderedPlayers(gameId);

    const challengerGP = gamePlayers.find(gp => gp.Player && gp.Player.username === challengerUsername);
    if (!challengerGP) throw new Error('Desafiante não encontrado neste jogo');

    const challengedGP = gamePlayers.find(gp => gp.Player && gp.Player.username === challengedUsername);
    if (!challengedGP) throw new Error('Jogador desafiado não encontrado neste jogo');

    const challengedHand = challengedGP.hand || [];

    // Só pode desafiar se o jogador tem exatamente 1 carta
    if (challengedHand.length !== 1) {
      throw new Error('Challenge failed. Player does not have exactly 1 card.');
    }

    // Se já disse UNO, desafio falha
    if (challengedGP.saidUno) {
      throw new Error(`Challenge failed. ${challengedUsername} said UNO on time.`);
    }

    // Desafio bem-sucedido: jogador desafiado compra 2 cartas
    let deck = [...(game.deck || [])];
    const newHand = [...challengedHand];

    for (let i = 0; i < 2; i++) {
      if (deck.length === 0) {
        deck = await this.reshuffleDeckFromDiscard(game);
      }
      if (deck.length > 0) {
        newHand.push(deck.pop());
      }
    }

    await challengedGP.update({ hand: newHand, saidUno: false });
    await game.update({ deck });

    return { 
      message: `Challenge successful. ${challengedUsername} forgot to say UNO and draws 2 cards.`
    };
  }

  // ========================================================
  // 6. TURNO TERMINA APÓS JOGAR OU COMPRAR
  //    (Já implementado nativamente em playCard e drawCard acima)
  //    Este método é uma ação unificada para uso pelo controller.
  // ========================================================

  /**
   * Ação de turno unificada: o jogador joga uma carta ou compra do baralho.
   * O turno termina automaticamente após qualquer ação válida.
   *
   * @param {number} gameId
   * @param {string} playerUsername
   * @param {string} action - "play-card" ou "draw-card"
   * @param {string} [card] - carta a jogar (necessário se action = "play-card")
   * @param {string} [chosenColor] - cor escolhida para Wild
   * @returns {Promise<Object>} resultado da ação
   */
  async executeTurn(gameId, playerUsername, action, card = null, chosenColor = null) {
    if (action === 'play-card') {
      if (!card) throw new Error('Você deve especificar qual carta jogar.');
      const result = await this.playCard(gameId, playerUsername, card, chosenColor);
      result.message = `${playerUsername} played ${card}. Turn ended.`;
      return result;
    } else if (action === 'draw-card') {
      const result = await this.drawCard(gameId, playerUsername);
      result.message = `${playerUsername} drew a card. Turn ended.`;
      return result;
    } else {
      throw new Error('Ação inválida. Use "play-card" ou "draw-card".');
    }
  }

  // ========================================================
  // DECK CREATION & DISTRIBUTION HELPERS
  // ========================================================

  /**
   * Cria um baralho completo de UNO (108 cartas)
   * - 4 cores (Red, Blue, Green, Yellow): 1x "0", 2x "1-9", 2x Skip, 2x Reverse, 2x Draw Two
   * - 4x Wild, 4x Wild Draw Four
   * @returns {string[]}
   */
  createUnoDeck() {
    const deck = [];
    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const actions = ['Skip', 'Reverse', 'Draw Two'];

    colors.forEach(color => {
      // Um "0" por cor
      deck.push(`${color} 0`);
      // Dois de cada "1-9" por cor
      numbers.slice(1).forEach(number => {
        deck.push(`${color} ${number}`);
        deck.push(`${color} ${number}`);
      });
      // Dois de cada ação por cor
      actions.forEach(action => {
        deck.push(`${color} ${action}`);
        deck.push(`${color} ${action}`);
      });
    });

    // 4 Wild e 4 Wild Draw Four
    for (let i = 0; i < 4; i++) {
      deck.push('Wild');
      deck.push('Wild Draw Four');
    }

    return deck; // 108 cartas
  }

  /**
   * Embaralha um array (Algoritmo Fisher-Yates)
   * @param {Array} array
   * @returns {Array}
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
   * Distribui cartas recursivamente entre jogadores.
   * @param {string[]} players - nomes dos jogadores
   * @param {number} cards - cartas por jogador
   * @param {string[]} deck - baralho (mutável, usa pop)
   * @param {Object} [hands={}] - acumulador
   * @param {number} [pIdx=0] - índice do jogador
   * @param {number} [round=0] - rodada
   * @returns {Object} mãos dos jogadores
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
   * @param {string[]} hand
   * @param {string} topCard
   * @param {string} currentColor
   * @param {number} [index=0]
   * @yields {string}
   */
  *findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
    if (index >= hand.length) return;
    
    const card = hand[index];
    if (this.isCardValid(card, topCard, currentColor)) {
      yield card;
    }
    
    yield* this.findValidCardsRecursive(hand, topCard, currentColor, index + 1);
  }
}

module.exports = new GameService();
