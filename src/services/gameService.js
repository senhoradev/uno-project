/**
 * @fileoverview Serviço responsável pela lógica de negócio dos jogos
 * @module services/gameService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer'); // Importante para gerenciar os participantes

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

    // 4. Atualiza o status do jogo para iniciado
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

module.exports = new GameService();