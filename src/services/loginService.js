/**
 * @fileoverview Serviço responsável pela autenticação de usuários (Login).
 * @module services/loginService
 */

const Player = require('../models/Player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Classe de serviço para gerenciar operações de login e autenticação.
 */
class LoginService {
  /**
   * Autentica um usuário verificando suas credenciais.
   * 
   * @param {string} username - O nome de usuário.
   * @param {string} password - A senha em texto plano.
   * @returns {Promise<Object>} Retorna um objeto contendo o token de acesso (JWT).
   * @throws {Error} Lança erro se as credenciais forem inválidas.
   */
  async authenticate(username, password) {
    // Busca o jogador pelo nome de usuário
    const player = await Player.findOne({ where: { username } });
    
    // Verifica se o jogador existe e se a senha fornecida corresponde ao hash salvo
    if (!player || !(await bcrypt.compare(password, player.password))) {
      throw new Error('Invalid credentials');
    }

    // Gera um token JWT contendo ID, username e email
    // O token expira em 3 horas
    const token = jwt.sign(
      { id: player.id, username: player.username, email: player.email },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '3h' }
    );

    return { access_token: token };
  }

  /**
   * Recupera o perfil do usuário a partir de um token JWT válido.
   * 
   * @param {string} token - O token JWT de acesso.
   * @returns {Promise<Object>} Retorna os dados básicos do usuário (username, email).
   * @throws {Error} Lança erro se o token for inválido ou expirado.
   */
  async getProfile(token) {
    try {
      // Verifica a validade do token usando a chave secreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      
      // Retorna apenas as informações decodificadas relevantes
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