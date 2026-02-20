/**
 * @fileoverview Serviço responsável pela autenticação de usuários (Login).
 */

const Player = require('../models/player'); // 'p' minúsculo conforme o arquivo no disco
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class LoginService {
  async authenticate(username, password) {
    // Busca o jogador pelo nome de usuário
    const player = await Player.findOne({ where: { username } });
    
    // Verifica se o jogador existe e se a senha corresponde
    if (!player || !(await bcrypt.compare(password, player.password))) {
      throw new Error('Invalid credentials');
    }

    // Incluímos o email no token para facilitar a recuperação do perfil (Requisito 4)
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
      
      // Retorna exatamente o que o Requisito 4 pede
      return {
        username: decoded.username,
        email: decoded.email
      };
    } catch (err) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new LoginService();