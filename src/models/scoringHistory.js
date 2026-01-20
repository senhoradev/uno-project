const { DataTypes } = require('sequelize'); // Importa os tipos de dados do Sequelize para definir os campos do modelo
const sequelize = require('../config/database');
 
 
// Define o modelo 'ScoringHistory' da tabela no banco de dados
const ScoringHistory = sequelize.define('ScoringHistory', {
 
  playerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  scoreId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});
 
module.exports = ScoringHistory; // Exporta o modelo para ser utilizado nos controllers e services