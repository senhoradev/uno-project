const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GamePlayer = sequelize.define('GamePlayer', {
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "O ID do jogo deve ser um número inteiro." },
      notNull: { msg: "O ID do jogo é obrigatório." }
    }
  },
  playerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "O ID do jogador deve ser um número inteiro." },
      notNull: { msg: "O ID do jogador é obrigatório." }
    }
  },
  isReady: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    validate: {
      isIn: { args: [[true, false]], msg: "O campo isReady deve ser booleano." }
    }
  },
  isCurrentTurn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = GamePlayer;