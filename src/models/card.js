const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Card = sequelize.define('Card', {
  color: {
    type: DataTypes.STRING, // "blue", "red", "green", "yellow"
    allowNull: false
  },
  action: {
    type: DataTypes.STRING, // "3", "7", "skip", "drawTwo", "buyFour"
    allowNull: false
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Card;