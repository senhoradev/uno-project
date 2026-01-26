const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 

// Define o modelo 'Player' da tabela no banco de dados
const Player = sequelize.define('Player', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

module.exports = Player; // Exporta o modelo para ser utilizado nos controllers e services