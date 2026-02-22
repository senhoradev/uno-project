/**
 * @fileoverview Serviço responsável pela lógica de negócio dos jogos
 * @module services/gameService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer'); // Importante para gerenciar os participantes
const Player = require('../models/player');

/**
 * Classe de serviço para operações de Game
 * @class GameService
 */
class GameService {
  /**
   * Cria um novo jogo e adiciona o criador automaticamente como primeiro jogador
   * @async
   * @param {Object} data - Dados do jogo (name, rules)
   * @param {number} creatorId - ID do usuário autenticado que está criando o jogo
   * @returns {Promise<Game>} O jogo criado
   */
  async createGame(data, creatorId) {
    const game = await Game.create({
      name: data.name,
      rules: data.rules,
      maxPlayers: data.maxPlayers, // Permite definir o limite de jogadores respeitando as validações do Model
      creatorId: creatorId,
      status: 'waiting' // Jogo começa aguardando jogadores
    });

    // O criador entra automaticamente no jogo e já fica "pronto"
    await GamePlayer.create({ 
      gameId: game.id, 
      playerId: creatorId, 
      isReady: true 
    });

    return game;
  }

  /**
   * Permite que um usuário entre em um jogo existente
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do usuário que deseja entrar
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se o jogo não existir, estiver cheio ou o usuário já estiver nele
   */
  async joinGame(gameId, playerId) {
    const game = await this.getGameById(gameId);

    if (game.status !== 'waiting') {
      throw new Error('Não é possível entrar em um jogo que já iniciou ou finalizou');
    }

    // Verifica se o jogo já atingiu o número máximo de jogadores
    const currentPlayers = await GamePlayer.count({ where: { gameId } });
    if (currentPlayers >= game.maxPlayers) {
      throw new Error('O jogo está cheio');
    }

    // Verifica se o usuário já está no jogo
    const alreadyIn = await GamePlayer.findOne({ 
      where: { gameId, playerId } 
    });
    
    if (alreadyIn) {
      throw new Error('Usuário já está neste jogo');
    }

    // Adiciona o jogador ao jogo
    await GamePlayer.create({ 
      gameId, 
      playerId, 
      isReady: false // Entra mas ainda não confirmou que está pronto
    });

    return true;
  }

  /**
   * Alterna o status de "pronto" de um jogador no jogo
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do jogador
   * @returns {Promise<Object>} Objeto com o novo status de isReady
   * @throws {Error} Se o jogador não estiver no jogo ou o jogo não estiver em espera
   */
  async toggleReady(gameId, playerId) {
    const game = await this.getGameById(gameId);

    // Verifica se o jogo está em fase de espera
    if (game.status !== 'waiting') {
      throw new Error('Não é possível alterar o status de pronto em um jogo que já iniciou ou finalizou');
    }

    // Verifica se o usuário está no jogo
    const gamePlayer = await GamePlayer.findOne({ 
      where: { gameId, playerId } 
    });
    
    if (!gamePlayer) {
      throw new Error('Usuário não está neste jogo');
    }

    // Alterna o status de isReady
    const newReadyStatus = !gamePlayer.isReady;
    await gamePlayer.update({ isReady: newReadyStatus });

    return { 
      isReady: newReadyStatus,
      message: newReadyStatus ? 'Você está pronto!' : 'Você não está mais pronto'
    };
  }

  /**
   * Permite que um usuário abandone um jogo em progresso
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do usuário que deseja sair
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se o jogo não estiver em andamento ou o usuário não estiver nele
   */
  async leaveGame(gameId, playerId) {
    const game = await this.getGameById(gameId);

    // Verifica se o jogo está em andamento
    if (game.status !== 'in_progress' && game.status !== 'started') {
      throw new Error('O jogo não está em andamento');
    }

    // Verifica se o usuário está no jogo
    const playerInGame = await GamePlayer.findOne({ 
      where: { gameId, playerId } 
    });
    
    if (!playerInGame) {
      throw new Error('Usuário não está neste jogo');
    }

    // Remove o jogador do jogo
    await playerInGame.destroy();

    // Verifica quantos jogadores restam
    const remainingPlayers = await GamePlayer.count({ where: { gameId } });
    
    // Se restar apenas 1 jogador ou nenhum, finaliza o jogo
    if (remainingPlayers <= 1) {
      await game.update({ status: 'finished' });
    }

    return true;
  }

  /**
   * Finaliza um jogo (apenas o criador pode finalizar)
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do usuário que solicita a finalização
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se não for o criador ou se o jogo não estiver em andamento
   */
  async endGame(gameId, userId) {
    const game = await this.getGameById(gameId);

    // Verifica se o usuário é o criador
    if (game.creatorId !== userId) {
      throw new Error('Apenas o criador do jogo pode encerrar a partida');
    }

    // Verifica se o jogo está em andamento
    if (game.status !== 'in_progress' && game.status !== 'started') {
      throw new Error('O jogo não está em andamento');
    }

    // Finaliza o jogo
    await game.update({ status: 'finished' });
    
    return true;
  }

  /**
   * Obtém o estado atual do jogo
   * @async
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Object>} Estado do jogo
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
   * @async
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Object>} Lista de jogadores
   */
  async getGamePlayers(gameId) {
    const game = await this.getGameById(gameId);
    
    const gamePlayers = await GamePlayer.findAll({ 
      where: { gameId },
      include: [{
        model: Player,
        attributes: ['id', 'username']
      }]
    });

    const players = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
    
    return {
      game_id: game.id,
      players: players
    };
  }

  /**
   * Inicia o jogo se o solicitante for o criador e todos estiverem prontos
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do usuário que solicita o início
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se não for o criador ou se houver jogadores não prontos
   */
  async startGame(gameId, userId) {
    const game = await this.getGameById(gameId);

    // 1. Verifica se o usuário é o criador
    if (game.creatorId !== userId) {
      throw new Error('Apenas o criador do jogo pode iniciar a partida');
    }

    // 2. Busca todos os jogadores do jogo
    const players = await GamePlayer.findAll({ where: { gameId } });

    if (players.length < 2) {
      throw new Error('É necessário pelo menos 2 jogadores para iniciar');
    }

    // 3. Verifica se todos estão prontos (isReady === true)
    const allReady = players.every(p => p.isReady === true);
    
    if (!allReady) {
      throw new Error('Nem todos os jogadores estão prontos');
    }

    // 4. Define o primeiro jogador como o jogador atual
    if (players.length > 0) {
      await players[0].update({ isCurrentTurn: true });
    }

    // 5. Atualiza o status do jogo para iniciado
    await game.update({ status: 'started' });
    
    return true;
  }

  /**
   * Busca um jogo pelo seu ID
   * @async
   * @param {number|string} id - ID do jogo
   * @returns {Promise<Game>} O jogo encontrado
   */
  async getGameById(id) {
    const game = await Game.findByPk(id);
    if (!game) throw new Error('Jogo não encontrado');
    return game;
  }

  /**
   * Atualiza os dados de um jogo existente
   */
  async updateGame(id, data) {
    const game = await this.getGameById(id);

    // Validação: Não permitir diminuir maxPlayers abaixo da quantidade atual de jogadores
    if (data.maxPlayers) {
      const currentPlayersCount = await GamePlayer.count({ where: { gameId: id } });
      if (data.maxPlayers < currentPlayersCount) {
        throw new Error(`Não é possível reduzir o limite para ${data.maxPlayers} pois já existem ${currentPlayersCount} jogadores na partida.`);
      }
    }

    return await game.update(data);
  }

  /**
   * Remove um jogo do banco de dados
   */
  async deleteGame(id) {
    const game = await this.getGameById(id);
    await game.destroy();
    return { message: 'Jogo removido com sucesso' };
  }
}

/**
 * Obtém o jogador atual que deve jogar uma carta
 * @param {number} gameId - ID do jogo
 * @returns {Promise<string>} - Nome do jogador atual
 */
async function getCurrentPlayer(gameId) {
  const game = await Game.findByPk(gameId);

  if (!game) {
    throw new Error('Jogo não encontrado');
  }

  const gamePlayer = await GamePlayer.findOne({
    where: { 
      gameId,
      isCurrentTurn: true 
    },
    include: [{
      model: Player,
      attributes: ['username']
    }]
  });

  if (!gamePlayer || !gamePlayer.Player) {
    throw new Error('Nenhum jogador está definido como o atual');
  }

  return gamePlayer.Player.username;
}

/**
 * Obtém a carta do topo da pilha de descarte
 * @param {number} gameId - ID do jogo
 * @returns {Promise<Object>} - Carta do topo
 */
async function getTopCard(gameId) {
  const game = await Game.findByPk(gameId);

  if (!game) {
    throw new Error('Jogo não encontrado');
  }

  const Card = require('../models/card');
  const topCard = await Card.findOne({
    where: { gameId },
    order: [['createdAt', 'DESC']]
  });

  if (!topCard) {
    throw new Error('Nenhuma carta encontrada na pilha de descarte');
  }

  return {
    color: topCard.color,
    action: topCard.action,
    id: topCard.id
  };
}

/**
 * Obtém as pontuações atuais de todos os jogadores
 * @param {number} gameId - ID do jogo
 * @returns {Promise<Object>} - Pontuações dos jogadores
 */
async function getScores(gameId) {
  const game = await Game.findByPk(gameId);

  if (!game) {
    throw new Error('Jogo não encontrado');
  }

  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{
      model: Player,
      attributes: ['username']
    }]
  });

  const scores = {};
  gamePlayers.forEach(gp => {
    if (gp.Player) {
      scores[gp.Player.username] = gp.score || 0;
    }
  });

  return scores;
}

/**
 * Cria um baralho completo de UNO
 * @returns {Array<Object>} - Baralho de cartas
 */
function createUnoDeck() {
  const deck = [];
  const colors = ['Red', 'Blue', 'Green', 'Yellow'];
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const actions = ['Skip', 'Reverse', 'Draw Two'];

  // Adiciona cartas numeradas e de ação para cada cor
  colors.forEach(color => {
    // Carta 0 (apenas 1 por cor)
    deck.push(`${color} 0`);
    
    // Cartas 1-9 (2 de cada por cor)
    numbers.slice(1).forEach(number => {
      deck.push(`${color} ${number}`);
      deck.push(`${color} ${number}`);
    });
    
    // Cartas de ação (2 de cada por cor)
    actions.forEach(action => {
      deck.push(`${color} ${action}`);
      deck.push(`${color} ${action}`);
    });
  });

  // Adiciona cartas especiais (4 de cada)
  for (let i = 0; i < 4; i++) {
    deck.push('Wild');
    deck.push('Wild Draw Four');
  }

  return deck;
}

/**
 * Embaralha um array usando o algoritmo Fisher-Yates
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} - Array embaralhado
 */
function shuffleDeck(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Função recursiva para distribuir cartas aos jogadores
 * @param {Array<string>} players - Lista de nomes dos jogadores
 * @param {number} cardsPerPlayer - Número de cartas por jogador
 * @param {Array<string>} deck - Baralho de cartas
 * @param {Object} playerHands - Objeto com as mãos dos jogadores
 * @param {number} currentPlayerIndex - Índice do jogador atual
 * @param {number} currentRound - Rodada atual de distribuição
 * @returns {Object} - Objeto com as cartas distribuídas
 */
function dealCardsRecursive(players, cardsPerPlayer, deck, playerHands = {}, currentPlayerIndex = 0, currentRound = 0) {
  // Caso base: todos os jogadores receberam o número correto de cartas
  if (currentRound >= cardsPerPlayer) {
    return playerHands;
  }

  // Inicializa a mão do jogador se ainda não existe
  const currentPlayer = players[currentPlayerIndex];
  if (!playerHands[currentPlayer]) {
    playerHands[currentPlayer] = [];
  }

  // Distribui uma carta para o jogador atual
  if (deck.length > 0) {
    const card = deck.pop();
    playerHands[currentPlayer].push(card);
  }

  // Próximo jogador
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  
  // Se voltamos ao primeiro jogador, incrementa a rodada
  const nextRound = nextPlayerIndex === 0 ? currentRound + 1 : currentRound;

  // Chamada recursiva
  return dealCardsRecursive(players, cardsPerPlayer, deck, playerHands, nextPlayerIndex, nextRound);
}

/**
 * Distribui cartas aos jogadores de um jogo
 * @async
 * @param {number} gameId - ID do jogo
 * @param {number} cardsPerPlayer - Número de cartas por jogador (padrão: 7)
 * @returns {Promise<Object>} - Objeto com as cartas distribuídas
 */
async function dealCards(gameId, cardsPerPlayer = 7) {
  const game = await Game.findByPk(gameId);

  if (!game) {
    throw new Error('Jogo não encontrado');
  }

  // Busca todos os jogadores do jogo
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{
      model: Player,
      attributes: ['id', 'username']
    }]
  });

  if (gamePlayers.length === 0) {
    throw new Error('Nenhum jogador encontrado neste jogo');
  }

  // Extrai os nomes dos jogadores
  const playerNames = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);

  // Cria e embaralha o baralho
  const deck = shuffleDeck(createUnoDeck());

  // Verifica se há cartas suficientes
  const totalCardsNeeded = playerNames.length * cardsPerPlayer;
  if (deck.length < totalCardsNeeded) {
    throw new Error(`Não há cartas suficientes no baralho. Necessário: ${totalCardsNeeded}, Disponível: ${deck.length}`);
  }

  // Distribui as cartas usando recursão
  const playerHands = dealCardsRecursive(playerNames, cardsPerPlayer, deck);

  // Atualiza as mãos dos jogadores no banco de dados
  for (const gamePlayer of gamePlayers) {
    const playerName = gamePlayer.Player ? gamePlayer.Player.username : `Player${gamePlayer.playerId}`;
    await gamePlayer.update({ hand: playerHands[playerName] || [] });
  }

  // Coloca a primeira carta da pilha na mesa (pilha de descarte)
  // Evita começar com cartas Wild
  let firstCard = deck.pop();
  while (firstCard && firstCard.startsWith('Wild') && deck.length > 0) {
    deck.unshift(firstCard); // Coloca no final do baralho
    firstCard = deck.pop();
  }
  
  // Salva o baralho restante e a pilha de descarte
  await game.update({
    discardPile: [firstCard],
    currentColor: null,
    deck: deck // Baralho restante para compras futuras
  });

  return {
    message: 'Cards dealt successfully.',
    players: playerHands,
    firstCard: firstCard
  };
}

/**
 * Extrai informações de uma carta (cor e valor/ação)
 * @param {string} card - Carta no formato "Color Value" (ex: "Red 7", "Wild Draw Four")
 * @returns {Object} - Objeto com color e value
 */
function parseCard(card) {
  const parts = card.trim().split(' ');
  
  if (parts[0] === 'Wild') {
    return {
      color: 'Wild',
      value: parts.slice(1).join(' ') || 'Wild',
      isWild: true
    };
  }
  
  return {
    color: parts[0],
    value: parts.slice(1).join(' '),
    isWild: false
  };
}

/**
 * Verifica se uma carta pode ser jogada baseado nas regras do UNO
 * @param {string} cardToPlay - Carta que o jogador quer jogar
 * @param {string} topCard - Carta do topo da pilha de descarte
 * @param {string} currentColor - Cor atual do jogo (para cartas Wild)
 * @returns {boolean} - True se a carta é válida
 */
function isValidCard(cardToPlay, topCard, currentColor) {
  const playedCard = parseCard(cardToPlay);
  const topCardParsed = parseCard(topCard);
  
  // Cartas Wild podem ser jogadas a qualquer momento
  if (playedCard.isWild) {
    return true;
  }
  
  // Se houver uma cor atual definida (após Wild), usar ela
  const effectiveColor = currentColor || topCardParsed.color;
  
  // Verifica se a cor é a mesma
  if (playedCard.color === effectiveColor) {
    return true;
  }
  
  // Verifica se o valor/ação é o mesmo
  if (playedCard.value === topCardParsed.value) {
    return true;
  }
  
  return false;
}

/**
 * Função recursiva (generator) para encontrar cartas válidas na mão do jogador
 * @param {Array<string>} hand - Mão do jogador
 * @param {string} topCard - Carta do topo
 * @param {string} currentColor - Cor atual
 * @param {number} index - Índice atual na recursão
 * @returns {Generator} - Gerador que retorna cartas válidas
 */
function* findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
  // Caso base: chegou ao fim da mão
  if (index >= hand.length) {
    return;
  }
  
  const card = hand[index];
  
  // Se a carta é válida, retorna ela
  if (isValidCard(card, topCard, currentColor)) {
    yield card;
  }
  
  // Chamada recursiva para a próxima carta
  yield* findValidCardsRecursive(hand, topCard, currentColor, index + 1);
}

/**
 * Obtém o próximo jogador na ordem
 * @param {Array} gamePlayers - Lista de jogadores do jogo
 * @param {number} currentPlayerIndex - Índice do jogador atual
 * @returns {Object} - Próximo jogador
 */
function getNextPlayer(gamePlayers, currentPlayerIndex) {
  const nextIndex = (currentPlayerIndex + 1) % gamePlayers.length;
  return gamePlayers[nextIndex];
}

/**
 * Executa a jogada de uma carta
 * @async
 * @param {number} gameId - ID do jogo
 * @param {string} playerUsername - Nome do jogador
 * @param {string} cardPlayed - Carta jogada
 * @param {string} [chosenColor] - Cor escolhida (obrigatório para cartas Wild)
 * @returns {Promise<Object>} - Resultado da jogada
 */
async function playCard(gameId, playerUsername, cardPlayed, chosenColor = null) {
  // Busca o jogo
  const game = await Game.findByPk(gameId);
  
  if (!game) {
    throw new Error('Jogo não encontrado');
  }
  
  if (game.status !== 'started') {
    throw new Error('O jogo não está em andamento');
  }
  
  // Busca todos os jogadores do jogo
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{
      model: Player,
      attributes: ['id', 'username']
    }],
    order: [['id', 'ASC']]
  });
  
  // Encontra o jogador atual e o que está jogando
  const currentPlayerIndex = gamePlayers.findIndex(gp => gp.isCurrentTurn);
  const playingPlayerIndex = gamePlayers.findIndex(gp => 
    gp.Player && gp.Player.username === playerUsername
  );
  
  if (playingPlayerIndex === -1) {
    throw new Error('Jogador não encontrado neste jogo');
  }
  
  // Verifica se é a vez do jogador
  if (currentPlayerIndex !== playingPlayerIndex) {
    throw new Error('Não é a sua vez de jogar');
  }
  
  const currentPlayer = gamePlayers[currentPlayerIndex];
  const playerHand = currentPlayer.hand || [];
  
  // Verifica se o jogador tem a carta na mão
  if (!playerHand.includes(cardPlayed)) {
    throw new Error('Você não possui esta carta na mão');
  }
  
  // Obtém a carta do topo da pilha de descarte
  const discardPile = game.discardPile || [];
  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  
  if (!topCard) {
    throw new Error('Não há carta na pilha de descarte. Distribua as cartas primeiro.');
  }
  
  // Valida se a carta pode ser jogada
  if (!isValidCard(cardPlayed, topCard, game.currentColor)) {
    throw new Error('Invalid card. Please play a card that matches the top card on the discard pile.');
  }
  
  // Verifica se é uma carta Wild e precisa de cor
  const playedCardInfo = parseCard(cardPlayed);
  if (playedCardInfo.isWild && !chosenColor) {
    throw new Error('Você deve escolher uma cor ao jogar uma carta Wild');
  }
  
  // Remove a carta da mão do jogador
  const newHand = playerHand.filter(c => c !== cardPlayed);
  
  // Verifica se precisa dizer UNO
  const needsToSayUno = newHand.length === 1;
  
  await currentPlayer.update({ 
    hand: newHand,
    isCurrentTurn: false,
    saidUno: false // Reseta o status ao jogar
  });
  
  // Adiciona a carta na pilha de descarte
  discardPile.push(cardPlayed);
  
  // Atualiza a cor atual (se for Wild)
  const newColor = playedCardInfo.isWild ? chosenColor : null;
  await game.update({
    discardPile: discardPile,
    currentColor: newColor
  });
  
  // Verifica se o jogador venceu (sem cartas na mão)
  if (newHand.length === 0) {
    await game.update({ status: 'finished' });
    return {
      message: 'Card played successfully. You won!',
      winner: playerUsername,
      cardPlayed: cardPlayed
    };
  }
  
  // Passa a vez para o próximo jogador
  const nextPlayer = getNextPlayer(gamePlayers, currentPlayerIndex);
  await nextPlayer.update({ isCurrentTurn: true });
  
  const nextPlayerName = nextPlayer.Player ? nextPlayer.Player.username : `Player${nextPlayer.playerId}`;
  
  return {
    message: 'Card played successfully.',
    cardPlayed: cardPlayed,
    nextPlayer: nextPlayerName,
    remainingCards: newHand.length,
    needsToSayUno: newHand.length === 1
  };
}

/**
 * Compra uma carta do baralho quando o jogador não pode jogar
 * @async
 * @param {number} gameId - ID do jogo
 * @param {string} playerUsername - Nome do jogador
 * @returns {Promise<Object>} - Resultado da compra
 */
async function drawCard(gameId, playerUsername) {
  // Busca o jogo
  const game = await Game.findByPk(gameId);
  
  if (!game) {
    throw new Error('Jogo não encontrado');
  }
  
  if (game.status !== 'started') {
    throw new Error('O jogo não está em andamento');
  }
  
  // Busca todos os jogadores do jogo
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{
      model: Player,
      attributes: ['id', 'username']
    }],
    order: [['id', 'ASC']]
  });
  
  // Encontra o jogador atual e o que está comprando
  const currentPlayerIndex = gamePlayers.findIndex(gp => gp.isCurrentTurn);
  const drawingPlayerIndex = gamePlayers.findIndex(gp => 
    gp.Player && gp.Player.username === playerUsername
  );
  
  if (drawingPlayerIndex === -1) {
    throw new Error('Jogador não encontrado neste jogo');
  }
  
  // Verifica se é a vez do jogador
  if (currentPlayerIndex !== drawingPlayerIndex) {
    throw new Error('Não é a sua vez de jogar');
  }
  
  const currentPlayer = gamePlayers[currentPlayerIndex];
  const playerHand = currentPlayer.hand || [];
  
  // Verifica o baralho
  let deck = game.deck || [];
  
  if (deck.length === 0) {
    throw new Error('Não há mais cartas no baralho');
  }
  
  // Compra uma carta do baralho
  const drawnCard = deck.pop();
  playerHand.push(drawnCard);
  
  // Atualiza o jogador e o baralho
  await currentPlayer.update({ 
    hand: playerHand,
    isCurrentTurn: false
  });
  
  await game.update({ deck: deck });
  
  // Passa a vez para o próximo jogador
  const nextPlayer = getNextPlayer(gamePlayers, currentPlayerIndex);
  await nextPlayer.update({ isCurrentTurn: true });
  
  const nextPlayerName = nextPlayer.Player ? nextPlayer.Player.username : `Player${nextPlayer.playerId}`;
  
  return {
    message: `${playerUsername} drew a card from the deck.`,
    cardDrawn: drawnCard,
    nextPlayer: nextPlayerName,
    remainingCardsInDeck: deck.length
  };
}

/**
 * Jogador diz "UNO" quando tem apenas 1 carta
 * @async
 * @param {number} gameId - ID do jogo
 * @param {string} playerUsername - Nome do jogador
 * @returns {Promise<Object>} - Resultado
 */
async function sayUno(gameId, playerUsername) {
  // Busca o jogo
  const game = await Game.findByPk(gameId);
  
  if (!game) {
    throw new Error('Jogo não encontrado');
  }
  
  if (game.status !== 'started') {
    throw new Error('O jogo não está em andamento');
  }
  
  // Busca o jogador
  const gamePlayer = await GamePlayer.findOne({
    where: { gameId },
    include: [{
      model: Player,
      attributes: ['id', 'username'],
      where: { username: playerUsername }
    }]
  });
  
  if (!gamePlayer) {
    throw new Error('Jogador não encontrado neste jogo');
  }
  
  const playerHand = gamePlayer.hand || [];
  
  // Verifica se o jogador realmente tem apenas 1 carta
  if (playerHand.length !== 1) {
    throw new Error('Você só pode dizer UNO quando tiver exatamente 1 carta na mão');
  }
  
  // Marca que o jogador disse UNO
  await gamePlayer.update({ saidUno: true });
  
  return {
    message: `${playerUsername} said UNO successfully.`
  };
}

/**
 * Desafia um jogador que não disse UNO
 * @async
 * @param {number} gameId - ID do jogo
 * @param {string} challengerUsername - Nome do desafiante
 * @param {string} challengedUsername - Nome do desafiado
 * @returns {Promise<Object>} - Resultado do desafio
 */
async function challengeUno(gameId, challengerUsername, challengedUsername) {
  // Busca o jogo
  const game = await Game.findByPk(gameId);
  
  if (!game) {
    throw new Error('Jogo não encontrado');
  }
  
  if (game.status !== 'started') {
    throw new Error('O jogo não está em andamento');
  }
  
  // Busca ambos os jogadores
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{
      model: Player,
      attributes: ['id', 'username']
    }],
    order: [['id', 'ASC']]
  });
  
  const challenger = gamePlayers.find(gp => 
    gp.Player && gp.Player.username === challengerUsername
  );
  
  const challenged = gamePlayers.find(gp => 
    gp.Player && gp.Player.username === challengedUsername
  );
  
  if (!challenger) {
    throw new Error('Desafiante não encontrado neste jogo');
  }
  
  if (!challenged) {
    throw new Error('Jogador desafiado não encontrado neste jogo');
  }
  
  const challengedHand = challenged.hand || [];
  
  // Verifica se o jogador desafiado tem exatamente 1 carta E não disse UNO
  if (challengedHand.length === 1 && !challenged.saidUno) {
    // Desafio bem-sucedido! Jogador desafiado compra 2 cartas
    let deck = game.deck || [];
    
    if (deck.length < 2) {
      throw new Error('Não há cartas suficientes no baralho para a penalidade');
    }
    
    const penaltyCards = [deck.pop(), deck.pop()];
    challengedHand.push(...penaltyCards);
    
    await challenged.update({ 
      hand: challengedHand,
      saidUno: false 
    });
    
    await game.update({ deck: deck });
    
    // Próximo jogador
    const currentPlayerIndex = gamePlayers.findIndex(gp => gp.isCurrentTurn);
    const nextPlayer = getNextPlayer(gamePlayers, currentPlayerIndex);
    const nextPlayerName = nextPlayer.Player ? nextPlayer.Player.username : `Player${nextPlayer.playerId}`;
    
    return {
      message: `Challenge successful. ${challengedUsername} forgot to say UNO and draws 2 cards.`,
      penaltyCards: penaltyCards,
      nextPlayer: nextPlayerName
    };
  }
  
  // Desafio falhou
  if (challenged.saidUno) {
    return {
      message: `Challenge failed. ${challengedUsername} said UNO on time.`,
      status: 'failed'
    };
  }
  
  if (challengedHand.length !== 1) {
    return {
      message: `Challenge failed. ${challengedUsername} does not have exactly 1 card.`,
      status: 'failed'
    };
  }
  
  return {
    message: 'Challenge failed.',
    status: 'failed'
  };
}

module.exports =  new GameService(); 
module.exports.getTopCard = getTopCard;
module.exports.getScores = getScores;
module.exports.getCurrentPlayer = getCurrentPlayer;
module.exports.dealCards = dealCards;
module.exports.playCard = playCard;
module.exports.drawCard = drawCard;
module.exports.sayUno = sayUno;
module.exports.challengeUno = challengeUno;
module.exports.findValidCardsRecursive = findValidCardsRecursive;