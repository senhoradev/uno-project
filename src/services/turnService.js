/**
 * @fileoverview Serviço responsável pelo gerenciamento de turnos, jogadas e compra de cartas
 * @module services/turnService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');
const deckService = require('./deckService');

/**
 * Classe de serviço para operações de turno no jogo UNO
 * @class TurnService
 */
class TurnService {

  // ========================================================
  // HELPERS DE TURNO
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
   * Usa aritmética modular para tratar circularidade do array de jogadores.
   *
   * @param {number} currentIndex - índice atual
   * @param {number} direction - 1 (horário) ou -1 (anti-horário)
   * @param {number} totalPlayers - total de jogadores
   * @param {number} [skip=1] - quantas posições avançar (2 para Skip/Draw)
   * @returns {number} próximo índice
   */
  getNextPlayerIndex(currentIndex, direction, totalPlayers, skip = 1) {
    return ((currentIndex + direction * skip) % totalPlayers + totalPlayers) % totalPlayers;
  }

  /**
   * Avança o turno: atualiza isCurrentTurn de todos os jogadores.
   * Apenas o jogador no nextIndex fica com isCurrentTurn=true.
   *
   * @param {GamePlayer[]} gamePlayers - lista ordenada por turnOrder
   * @param {number} nextIndex - índice (turnOrder) do próximo jogador
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
   * Retorna o username de um GamePlayer (com fallback)
   * @param {GamePlayer} gp
   * @returns {string}
   */
  getPlayerName(gp) {
    return gp.Player ? gp.Player.username : `Player${gp.playerId}`;
  }

  // ========================================================
  // VALIDAÇÃO DE CARTAS
  // ========================================================

  /**
   * Verifica se uma carta é válida para ser jogada sobre a carta do topo.
   * Regras:
   * - Wild: sempre válida
   * - Mesma cor que a cor corrente (currentColor, não a cor literal da topCard)
   * - Mesmo valor/ação que a carta do topo
   *
   * @param {string} card - carta a jogar (ex: "Red 5", "Wild Draw Four")
   * @param {string} topCard - carta do topo da pilha de descarte
   * @param {string} currentColor - cor corrente do jogo
   * @returns {boolean}
   */
  isCardValid(card, topCard, currentColor) {
    if (card.startsWith('Wild')) return true;

    const cardParts = card.split(' ');
    const topParts = topCard.split(' ');

    const cardColor = cardParts[0];
    const cardValue = cardParts.slice(1).join(' ');
    const topValue = topParts[0] === 'Wild' ? null : topParts.slice(1).join(' ');

    // Mesma cor (comparar com currentColor)
    if (cardColor === currentColor) return true;

    // Mesmo valor/ação
    if (topValue && cardValue === topValue) return true;

    return false;
  }

  /**
   * Encontra cartas válidas recursivamente usando Generator.
   * Percorre a mão do jogador e yield cada carta válida.
   *
   * @param {string[]} hand - mão do jogador
   * @param {string} topCard - carta do topo
   * @param {string} currentColor - cor corrente
   * @param {number} [index=0] - índice atual na mão
   * @yields {string} carta válida
   */
  *findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
    if (index >= hand.length) return;

    const card = hand[index];
    if (this.isCardValid(card, topCard, currentColor)) {
      yield card;
    }

    yield* this.findValidCardsRecursive(hand, topCard, currentColor, index + 1);
  }

  // ========================================================
  // JOGAR CARTA
  // ========================================================

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
    const game = await Game.findByPk(gameId);
    if (!game) throw new Error('Jogo não encontrado');
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
    const newColor = cardPlayed.startsWith('Wild') ? chosenColor : cardPlayed.split(' ')[0];

    // Reseta saidUno se jogador não tem mais 1 carta
    const saidUno = playerHand.length === 1 ? currentGP.saidUno : false;

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
    const result = await this.applyCardEffect(
      game, gamePlayers, totalPlayers, cardPlayed, discardPile, newColor, playerUsername, playerHand
    );

    return result;
  }

  /**
   * Aplica os efeitos de cartas de ação (Reverse, Skip, Draw Two, Wild Draw Four)
   * e avança o turno para o próximo jogador.
   *
   * @param {Game} game - instância do jogo
   * @param {GamePlayer[]} gamePlayers - jogadores ordenados
   * @param {number} totalPlayers - total de jogadores
   * @param {string} cardPlayed - carta que foi jogada
   * @param {string[]} discardPile - pilha de descarte atualizada
   * @param {string} newColor - nova cor corrente
   * @param {string} playerUsername - quem jogou
   * @param {string[]} playerHand - mão restante do jogador
   * @returns {Promise<Object>} resultado com nextPlayer, skippedPlayer, etc.
   */
  async applyCardEffect(game, gamePlayers, totalPlayers, cardPlayed, discardPile, newColor, playerUsername, playerHand) {
    let direction = game.direction;
    const currentIndex = game.currentPlayerIndex;

    const cardValue = cardPlayed.startsWith('Wild')
      ? (cardPlayed === 'Wild Draw Four' ? 'Draw Four' : null)
      : cardPlayed.split(' ').slice(1).join(' ');

    let skippedPlayer = null;
    let nextIndex;

    if (cardValue === 'Reverse') {
      direction *= -1;
      if (totalPlayers === 2) {
        // Com 2 jogadores, Reverse funciona como Skip
        nextIndex = currentIndex;
      } else {
        nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
      }

    } else if (cardValue === 'Skip') {
      const skippedIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
      skippedPlayer = this.getPlayerName(gamePlayers[skippedIndex]);
      nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers, 2);

    } else if (cardValue === 'Draw Two') {
      const penaltyResult = await this.applyDrawPenalty(game, gamePlayers, currentIndex, direction, totalPlayers, 2);
      skippedPlayer = penaltyResult.penaltyPlayerName;
      nextIndex = penaltyResult.nextIndex;

    } else if (cardValue === 'Draw Four') {
      const penaltyResult = await this.applyDrawPenalty(game, gamePlayers, currentIndex, direction, totalPlayers, 4);
      skippedPlayer = penaltyResult.penaltyPlayerName;
      nextIndex = penaltyResult.nextIndex;

    } else {
      // Carta normal (número ou Wild simples)
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

    const nextPlayerName = this.getPlayerName(gamePlayers[nextIndex]);

    const response = {
      message: 'Card played successfully.',
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

  /**
   * Aplica penalidade de compra (Draw Two ou Wild Draw Four).
   * O jogador penalizado compra N cartas e perde o turno.
   *
   * @param {Game} game - instância do jogo
   * @param {GamePlayer[]} gamePlayers - jogadores ordenados
   * @param {number} currentIndex - índice do jogador atual
   * @param {number} direction - direção do jogo
   * @param {number} totalPlayers - total de jogadores
   * @param {number} cardsToDraw - quantas cartas o penalizado compra (2 ou 4)
   * @returns {Promise<Object>} { penaltyPlayerName, nextIndex }
   */
  async applyDrawPenalty(game, gamePlayers, currentIndex, direction, totalPlayers, cardsToDraw) {
    const penaltyIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers);
    const penaltyPlayer = gamePlayers[penaltyIndex];
    const penaltyHand = [...(penaltyPlayer.hand || [])];
    let deck = [...(game.deck || [])];

    const drawnCards = await deckService.drawCardsFromDeck(game, deck, cardsToDraw);
    penaltyHand.push(...drawnCards);

    await penaltyPlayer.update({ hand: penaltyHand, saidUno: false });
    await game.update({ deck });

    const penaltyPlayerName = this.getPlayerName(penaltyPlayer);
    const nextIndex = this.getNextPlayerIndex(currentIndex, direction, totalPlayers, 2);

    return { penaltyPlayerName, nextIndex };
  }

  // ========================================================
  // COMPRAR CARTA DO BARALHO
  // ========================================================

  /**
   * O jogador compra uma carta do baralho (quando não pode jogar).
   * O turno passa automaticamente para o próximo jogador.
   *
   * @param {number} gameId
   * @param {string} playerUsername
   * @returns {Promise<Object>} resultado com a carta comprada e próximo jogador
   */
  async drawCard(gameId, playerUsername) {
    const game = await Game.findByPk(gameId);
    if (!game) throw new Error('Jogo não encontrado');
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await this.getOrderedPlayers(gameId);
    const totalPlayers = gamePlayers.length;

    const currentGP = gamePlayers.find(gp => gp.Player && gp.Player.username === playerUsername);
    if (!currentGP) throw new Error('Jogador não encontrado neste jogo');
    if (!currentGP.isCurrentTurn) throw new Error('Não é sua vez');

    let deck = [...(game.deck || [])];

    // Se o deck está vazio, reembaralha a pilha de descarte
    if (deck.length === 0) {
      deck = await deckService.reshuffleDeckFromDiscard(game);
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

    const nextPlayerName = this.getPlayerName(gamePlayers[nextIndex]);

    return {
      message: `${playerUsername} drew a card from the deck.`,
      cardDrawn: drawnCard,
      nextPlayer: nextPlayerName
    };
  }

  // ========================================================
  // AÇÃO UNIFICADA DE TURNO
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
}

module.exports = new TurnService();
