const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScoringHistory = sequelize.define('ScoringHistory', {
  playerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "O ID do jogador deve ser um número inteiro." },
      notNull: { msg: "O ID do jogador é obrigatório." }
    }
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "O ID do jogo deve ser um número inteiro." },
      notNull: { msg: "O ID do jogo é obrigatório." }
    }
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "A pontuação deve ser um número inteiro." },
      notNull: { msg: "A pontuação é obrigatória." }
    }
  }
});

module.exports = ScoringHistory;