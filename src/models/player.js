const { DataTypes } = require('sequelize'); // Importa os tipos de dados do Sequelize
const sequelize = require('../config/database'); // Importa a conexão com o banco

// Define o modelo 'Player' da tabela no banco de dados
const Player = sequelize.define('Player', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // Garante que não haja nomes de usuário duplicados
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
    unique: true // Garante que o e-mail seja único no sistema
  }
});

// Exporta o modelo para ser utilizado nos controllers e services
module.exports = Player;