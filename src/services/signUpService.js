/**
 * @fileoverview Serviço responsável pelo registro de novos usuários (Sign Up).
 * @module services/signUpService
 */

const Player = require('../models/player');
const bcrypt = require('bcrypt');

class SignUpService {
  /**
   * Registra um novo jogador no sistema.
   * 
   * @param {Object} data - Objeto contendo os dados do registro.
   * @param {string} data.username - Nome de usuário escolhido.
   * @param {string} data.email - Endereço de email do usuário.
   * @param {string} data.password - Senha em texto plano.
   * @param {string} [data.name] - Nome do jogador (opcional).
   * @param {number} [data.age] - Idade do jogador (opcional).
   * @returns {Promise<Object>} Retorna o objeto do jogador criado.
   * @throws {Error} Lança erro se o usuário ou email já existirem.
   */
  async register(data) {
    const { username, email, password } = data;

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Verifica no banco de dados se já existe um jogador com o mesmo username ou email
    const existingPlayer = await Player.findOne({
      where: {
        [require('sequelize').Op.or]: [{ username }, { email }]
      }
    });

    if (existingPlayer) {
      throw new Error('User already exists');
    }

    // Gera o hash da senha com um custo de 10 rounds para segurança antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o novo jogador no banco de dados.
    // O modelo Player exige 'name' e 'age', então usamos fallbacks caso não sejam fornecidos.
    return await Player.create({
      username,
      email,
      password: hashedPassword,
      name: data.name || username, // Fallback para cumprir o allowNull: false
      age: data.age || 0           // Fallback para cumprir o allowNull: false
    });
  }
}

module.exports = new SignUpService();