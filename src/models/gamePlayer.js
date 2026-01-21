const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GamePlayer = sequelize.define('GamePlayer', {
  gameId: { type: DataTypes.INTEGER, allowNull: false },
  playerId: { type: DataTypes.INTEGER, allowNull: false },
  isReady: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = GamePlayer;