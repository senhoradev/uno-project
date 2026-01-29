const Player = require('../models/player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const playerRepository = require('../repository/PlayerRepository');
const PlayerResponseDTO = require('../DTO/Response/PlayerResponseDTO');

class PlayerService {
  async createPlayer(playerToSave) {
    const { email, password, username } = playerToSave;

    if (!password || password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    if (await playerRepository.existsByEmail(email)) {
      throw new Error('User already exists');
    }

    playerToSave.password = await bcrypt.hash(password, 10);

    await playerRepository.save(playerToSave);

    return new PlayerResponseDTO(username, email);
  }


  async login(username, password) {
    const player = await Player.findOne({ where: { username } });
    
    if (!player || !(await bcrypt.compare(password, player.password))) {
      throw new Error('Invalid credentials'); // Consistente com o Requisito 2
    }

    // Adicionamos o email no payload para o Requisito 4
    const token = jwt.sign(
      { id: player.id, username: player.username, email: player.email }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '3h' }
    );
    
    return { access_token: token };
  }

  async getProfile(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      // Em vez de buscar no banco, podemos retornar do token (mais rápido) 
      // ou buscar para garantir dados atualizados:
      const player = await Player.findByPk(decoded.id);
      if (!player) throw new Error('User not found');

      return {
        username: player.username,
        email: player.email
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
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

    // Se a senha estiver sendo atualizada, realiza a validação e o hash
    if (data.password) {
      if (data.password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres');
      data.password = await bcrypt.hash(data.password, 10);
    }

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