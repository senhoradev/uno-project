const Player = require('../models/Player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


class PlayerService {
  // Cria um novo player recebendo os dados do controller
  async createPlayer(data) { 
    const { username, email, password} = data;

    const existingPlayer = await Player.findOne({ where: { username, email } });
    if(existingPlayer) throw new Error('Usuário já existe');

    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await Player.create({data, password: hashedPassword});
  }

  async login(username, password) {
    const player = await Player.findOne({ where: { username } });
    if (!player || !(await bcrypt.compare(password, player.password))) 
      {throw new Error('Credenciais inválidas');}

    const token = jwt.sign({ id: player.id, username: player.username}, process.env.JWT_SECRET, { expiresIn: '3h' });
    
    return { access_token: token };
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