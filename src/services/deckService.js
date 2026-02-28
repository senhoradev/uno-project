/**
 * @fileoverview Serviço responsável pela criação, embaralhamento e distribuição do baralho UNO
 * @module services/deckService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');

/**
 * Classe de serviço para operações com o baralho
 * @class DeckService
 */
class DeckService {

  // ========================================================
  // CRIAÇÃO DO BARALHO
  // ========================================================

  /**
   * Cria um baralho completo de UNO (108 cartas)
   * - 4 cores (Red, Blue, Green, Yellow): 1x "0", 2x "1-9", 2x Skip, 2x Reverse, 2x Draw Two
   * - 4x Wild, 4x Wild Draw Four
   * @returns {string[]} Array com 108 cartas
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

  // ========================================================
  // EMBARALHAMENTO
  // ========================================================

  /**
   * Embaralha um array usando o algoritmo Fisher-Yates
   * @param {Array} array - Array a ser embaralhado
   * @returns {Array} Novo array embaralhado (não modifica o original)
   */
  shuffleDeck(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ========================================================
  // DISTRIBUIÇÃO RECURSIVA
  // ========================================================

  /**
   * Distribui cartas recursivamente entre jogadores.
   * Cada chamada entrega 1 carta a 1 jogador, depois avança para o próximo jogador.
   * Quando todos recebem 1 carta, avança para a próxima rodada.
   *
   * @param {string[]} players - nomes dos jogadores
   * @param {number} cardsPerPlayer - cartas por jogador
   * @param {string[]} deck - baralho (mutável, usa pop)
   * @param {Object} [hands={}] - acumulador de mãos
   * @param {number} [playerIndex=0] - índice do jogador atual
   * @param {number} [round=0] - rodada atual (0 a cardsPerPlayer-1)
   * @returns {Object} Objeto { nomeJogador: [cartas] }
   */
  dealCardsRecursive(players, cardsPerPlayer, deck, hands = {}, playerIndex = 0, round = 0) {
    // Caso base: todas as rodadas foram distribuídas
    if (round >= cardsPerPlayer) return hands;

    const player = players[playerIndex];
    if (!hands[player]) hands[player] = [];

    if (deck.length > 0) {
      hands[player].push(deck.pop());
    }

    const nextPlayerIndex = (playerIndex + 1) % players.length;
    const nextRound = nextPlayerIndex === 0 ? round + 1 : round;

    return this.dealCardsRecursive(players, cardsPerPlayer, deck, hands, nextPlayerIndex, nextRound);
  }

  // ========================================================
  // DISTRIBUIÇÃO PRINCIPAL
  // ========================================================

  /**
   * Distribui cartas aos jogadores de um jogo.
   * Cria um baralho UNO completo, embaralha, distribui recursivamente,
   * e coloca a primeira carta válida (numérica) na pilha de descarte.
   *
   * @param {number} gameId - ID do jogo
   * @param {GamePlayer[]} gamePlayers - jogadores ordenados por turnOrder
   * @param {number} [cardsPerPlayer=7] - Número de cartas por jogador
   * @returns {Promise<Object>} Resultado com playerHands, firstCard e deck restante
   */
  async dealCards(gameId, gamePlayers, cardsPerPlayer = 7) {
    if (gamePlayers.length === 0) throw new Error('Sem jogadores');

    const playerNames = gamePlayers.map(gp =>
      gp.Player ? gp.Player.username : `Player${gp.playerId}`
    );

    const deck = this.shuffleDeck(this.createUnoDeck());

    // Distribui recursivamente
    const playerHands = this.dealCardsRecursive(playerNames, cardsPerPlayer, deck);

    // Persiste a mão de cada jogador e reseta saidUno
    for (const gamePlayer of gamePlayers) {
      const name = gamePlayer.Player ? gamePlayer.Player.username : `Player${gamePlayer.playerId}`;
      await gamePlayer.update({ hand: playerHands[name] || [], saidUno: false });
    }

    // Primeira carta da pilha de descarte deve ser numérica (não Wild, não ação)
    const firstCard = this.drawFirstValidCard(deck);
    const firstColor = firstCard.split(' ')[0];

    return { playerHands, firstCard, firstColor, remainingDeck: deck };
  }

  // ========================================================
  // CARTA INICIAL DA PILHA DE DESCARTE
  // ========================================================

  /**
   * Retira a primeira carta válida (numérica, não-Wild) para iniciar a pilha de descarte.
   * Se todas forem Wild/ação, aceita qualquer carta colorida como fallback.
   *
   * @param {string[]} deck - deck mutável (modifica in-place via splice)
   * @returns {string} carta inicial válida
   */
  drawFirstValidCard(deck) {
    // Procura uma carta numérica (ex: "Red 3")
    for (let i = deck.length - 1; i >= 0; i--) {
      const card = deck[i];
      const parts = card.split(' ');
      if (parts.length === 2 && ['Red', 'Blue', 'Green', 'Yellow'].includes(parts[0]) && /^[0-9]$/.test(parts[1])) {
        deck.splice(i, 1);
        return card;
      }
    }
    // Fallback: qualquer carta com cor (não-Wild)
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
  // REEMBARALHAR DESCARTE COMO NOVO BARALHO
  // ========================================================

  /**
   * Reaproveita a pilha de descarte como baralho quando o deck fica vazio.
   * Mantém a última carta (topo) na pilha de descarte.
   *
   * @param {Game} game - instância do jogo (será atualizada no banco)
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
  // COMPRAR CARTAS DO BARALHO (para penalidades)
  // ========================================================

  /**
   * Compra N cartas do baralho para um jogador (usado em penalidades Draw Two / Wild Draw Four).
   * Se o deck acabar, reembaralha automaticamente a pilha de descarte.
   *
   * @param {Game} game - instância do jogo
   * @param {string[]} deck - referência ao deck atual (será modificado)
   * @param {number} count - quantas cartas comprar
   * @returns {Promise<string[]>} array com as cartas compradas
   */
  async drawCardsFromDeck(game, deck, count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (deck.length === 0) {
        const reshuffled = await this.reshuffleDeckFromDiscard(game);
        deck.push(...reshuffled);
      }
      if (deck.length > 0) {
        drawn.push(deck.pop());
      }
    }
    return drawn;
  }
}

module.exports = new DeckService();
