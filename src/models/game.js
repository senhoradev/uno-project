/**
 * @fileoverview Modelo Sequelize para a entidade Game
 * @module models/game
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.selector');

/**
 * Modelo Game - Representa um jogo no sistema
 * @typedef {Object} Game
 * @property {number} id - Identificador único do jogo (gerado automaticamente)
 * @property {string} name - Nome do jogo (3-100 caracteres)
 * @property {string} rules - Regras específicas do jogo
 * @property {string} status - Status do jogo ('active', 'waiting', 'started', 'finished')
 * @property {number} maxPlayers - Número máximo de jogadores permitidos (2-10)
 * @property {number} creatorId - ID do jogador que criou o jogo
 * @property {Date} createdAt - Data de criação do registro
 * @property {Date} updatedAt - Data da última atualização do registro
 */
const Game = sequelize.define('Game', {
  /**
   * Nome do jogo (conforme requisito de entrada: "name")
   * @type {string}
   */
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'O nome não pode estar vazio'
      },
      len: {
        args: [3, 100],
        msg: 'O nome deve ter entre 3 e 100 caracteres'
      },
      isString(value) {
        if (typeof value !== 'string') {
          throw new Error('O nome deve ser uma string');
        }
      }
    }
  },
  /**
   * Regras do jogo
   * @type {string}
   */
  rules: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  /**
   * Status atual do jogo
   * @type {string}
   * @default 'waiting'
   */
  status: {
    type: DataTypes.ENUM('active', 'waiting', 'started', 'finished'),
    allowNull: false,
    defaultValue: 'waiting',
    validate: {
      isIn: {
        args: [['active', 'waiting', 'started', 'finished']],
        msg: 'Status deve ser: active, waiting, started ou finished'
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
  },
  /**
   * ID do criador do jogo para controle de permissão ao iniciar
   * @type {number}
   */
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "O ID do criador deve ser um número inteiro." },
      notNull: { msg: "O ID do criador é obrigatório." }
    }
  },
  /**
   * Pilha de descarte - armazena as cartas jogadas
   * @type {Array}
   */
  discardPile: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false,
    comment: "Armazena as cartas na pilha de descarte"
  },
  /**
   * Cor atual do jogo (importante para cartas Wild)
   * @type {string}
   */
  currentColor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Cor atual após cartas Wild serem jogadas"
  },
  /**
   * Baralho restante (cartas não distribuídas)
   * @type {Array}
   */
  deck: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false,
    comment: "Armazena as cartas restantes no baralho para compra"
  },
  /**
   * Direção do jogo (1 = horário, -1 = anti-horário)
   * @type {number}
   */
  direction: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: "1 = horário, -1 = anti-horário"
  },
  /**
   * Índice do jogador atual na ordem do jogo
   * @type {number}
   */
  currentPlayerIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: "Índice do jogador atual na lista ordenada de jogadores"
  },
  /**
   * Quantidade de cartas a serem compradas pelo próximo jogador (acúmulo de Draw Two / Wild Draw Four)
   * @type {number}
   */
  drawPenalty: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: "Cartas pendentes de compra acumuladas"
  }
});

module.exports = Game;
