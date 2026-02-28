const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.selector');

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
  },
  hand: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false,
    comment: "Armazena as cartas na mão do jogador"
  },
  saidUno: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Indica se o jogador disse UNO ao ficar com 1 carta"
  },
  turnOrder: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Posição do jogador na ordem de turnos"
  }
});

module.exports = GamePlayer;
