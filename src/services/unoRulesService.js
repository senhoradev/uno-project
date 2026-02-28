/**
 * @fileoverview Serviço responsável pelas regras de UNO (dizer UNO e desafiar)
 * @module services/unoRulesService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');
const deckService = require('./deckService');

/**
 * Classe de serviço para regras de UNO (say UNO / challenge UNO)
 * @class UnoRulesService
 */
class UnoRulesService {

  // ========================================================
  // DIZER "UNO"
  // ========================================================

  /**
   * Jogador declara "UNO" quando tem exatamente 1 carta restante.
   * Deve ser chamado DEPOIS de jogar a penúltima carta (ficando com 1).
   * Marca o campo saidUno=true, protegendo contra desafios.
   *
   * @param {number} gameId - ID do jogo
   * @param {string} playerUsername - nome do jogador
   * @returns {Promise<Object>} resultado com mensagem de sucesso
   * @throws {Error} Se o jogo não está iniciado, jogador não existe, não tem 1 carta, ou já disse UNO
   */
  async sayUno(gameId, playerUsername) {
    const game = await Game.findByPk(gameId);
    if (!game) throw new Error('Jogo não encontrado');
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await GamePlayer.findAll({
      where: { gameId },
      include: [{ model: Player, attributes: ['id', 'username'] }]
    });

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
  // DESAFIAR JOGADOR QUE NÃO DISSE "UNO"
  // ========================================================

  /**
   * Um jogador desafia outro que tem 1 carta e não disse UNO.
   * 
   * Regras:
   * - Só pode desafiar se o jogador desafiado tem exatamente 1 carta
   * - Se o desafiado NÃO disse UNO (saidUno=false), ele compra 2 cartas (penalidade)
   * - Se o desafiado JÁ disse UNO (saidUno=true), o desafio falha
   *
   * @param {number} gameId - ID do jogo
   * @param {string} challengerUsername - nome de quem está desafiando
   * @param {string} challengedUsername - nome de quem está sendo desafiado
   * @returns {Promise<Object>} resultado do desafio
   * @throws {Error} Se desafio falhar ou jogadores não existirem
   */
  async challengeUno(gameId, challengerUsername, challengedUsername) {
    const game = await Game.findByPk(gameId);
    if (!game) throw new Error('Jogo não encontrado');
    if (game.status !== 'started') throw new Error('Jogo não iniciado');

    const gamePlayers = await GamePlayer.findAll({
      where: { gameId },
      include: [{ model: Player, attributes: ['id', 'username'] }]
    });

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

    const drawnCards = await deckService.drawCardsFromDeck(game, deck, 2);
    newHand.push(...drawnCards);

    await challengedGP.update({ hand: newHand, saidUno: false });
    await game.update({ deck });

    return {
      message: `Challenge successful. ${challengedUsername} forgot to say UNO and draws 2 cards.`
    };
  }
}

module.exports = new UnoRulesService();
