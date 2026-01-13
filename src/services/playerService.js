const Player = require('../models/Player');

class PlayerService {
  // Cria um novo player recebendo os dados do controller
  async createPlayer(data) { 
    return await Player.create(data);
  }

  // Busca um jogador pelo ID
  async getPlayerById(id) {
    const player = await Player.findByPk(id);
    if (!player) throw new Error('Jogador não encontrado');
    return player;
  }

  // Atualiza os dados de um jogador existente
  async updatePlayer(id, data) {
    // Reutiliza o método getPlayerById para garantir que o jogador existe antes de atualizar
    const player = await this.getPlayerById(id);
    return await player.update(data);
  }

  // Remove um jogador do banco de dados
  async deletePlayer(id) {
    // Busca o jogador para garantir que ele existe antes da exclusão
    const player = await this.getPlayerById(id);
    await player.destroy();
    return { message: 'Jogador removido com sucesso' };
  }
}

// Exporta uma instância única do serviço para ser usada
module.exports = new PlayerService();