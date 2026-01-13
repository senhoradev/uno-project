const Player = require('../models/Player');

class PlayerService {
  async createPlayer(data) {
    return await Player.create(data);
  }

  async getPlayerById(id) {
    const player = await Player.findByPk(id);
    if (!player) throw new Error('Jogador não encontrado');
    return player;
  }

  async updatePlayer(id, data) {
    const player = await this.getPlayerById(id);
    return await player.update(data);
  }

  async deletePlayer(id) {
    const player = await this.getPlayerById(id);
    await player.destroy();
    return { message: 'Jogador removido com sucesso' };
  }
}

module.exports = new PlayerService();