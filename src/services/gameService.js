/**
 * @fileoverview Serviço responsável pela lógica de negócio dos jogos
 * @module services/gameService
 */

const Game = require('../models/game');

/**
 * Classe de serviço para operações CRUD de Game
 * @class GameService
 */
class GameService {
  // Cria um novo game recebendo os dados do controller
  async createGame(data) {
    return await Game.create(data);
  }

  /**
   * Busca um jogo pelo seu ID
   * @async
   * @param {number|string} id - ID do jogo a ser buscado
   * @returns {Promise<Game>} O jogo encontrado
   * @throws {Error} Se o jogo não for encontrado
   */
  async getGameById(id) {
    const game = await Game.findByPk(id);
    if (!game) throw new Error('Jogo não encontrado');
    return game;
  }

  /**
   * Atualiza os dados de um jogo existente
   * @async
   * @param {number|string} id - ID do jogo a ser atualizado
   * @param {Object} data - Dados a serem atualizados
   * @param {string} [data.title] - Novo título do jogo
   * @param {string} [data.status] - Novo status do jogo
   * @param {number} [data.maxPlayers] - Novo número máximo de jogadores
   * @returns {Promise<Game>} O jogo atualizado
   * @throws {Error} Se o jogo não for encontrado
   */
  async updateGame(id, data) {
    // Reutiliza o método getGameById para garantir que o game existe antes de atualizar
    const game = await this.getGameById(id);
    return await game.update(data);
  }

  /**
   * Remove um jogo do banco de dados
   * @async
   * @param {number|string} id - ID do jogo a ser removido
   * @returns {Promise<Object>} Mensagem de confirmação da exclusão
   * @returns {string} return.message - Mensagem de sucesso
   * @throws {Error} Se o jogo não for encontrado
   */
  async deleteGame(id) {
    const game = await this.getGameById(id);
    await game.destroy();
    return { message: 'Jogo removido com sucesso' };
  }
}

module.exports = new GameService();
