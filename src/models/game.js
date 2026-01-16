/**
 * @fileoverview Modelo Sequelize para a entidade Game
 * @module models/game
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modelo Game - Representa um jogo no sistema
 * @typedef {Object} Game
 * @property {number} id - Identificador único do jogo (gerado automaticamente)
 * @property {string} title - Título do jogo (3-100 caracteres)
 * @property {string} status - Status do jogo ('active', 'waiting', 'finished')
 * @property {number} maxPlayers - Número máximo de jogadores permitidos (2-10)
 * @property {Date} createdAt - Data de criação do registro
 * @property {Date} updatedAt - Data da última atualização do registro
 */
const Game = sequelize.define('Game', {
  /**
   * Título do jogo
   * @type {string}
   */
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'O título não pode estar vazio'
      },
      len: {
        args: [3, 100],
        msg: 'O título deve ter entre 3 e 100 caracteres'
      },
      isString(value) {
        if (typeof value !== 'string') {
          throw new Error('O título deve ser uma string');
        }
      }
    }
  },
  /**
   * Status atual do jogo
   * @type {string}
   * @default 'active'
   */
  status: {
    type: DataTypes.ENUM('active', 'waiting', 'finished'),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'waiting', 'finished']],
        msg: 'Status deve ser: active, waiting ou finished'
      }
    }
  },
  /**
   * Número máximo de jogadores
   * @type {number}
   * @default 4
   */
  maxPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    validate: {
      isInt: {
        msg: 'maxPlayers deve ser um número inteiro'
      },
      min: {
        args: [2],
        msg: 'O número mínimo de jogadores é 2'
      },
      max: {
        args: [10],
        msg: 'O número máximo de jogadores é 10'
      }
    }
  }
});

module.exports = Game; 
