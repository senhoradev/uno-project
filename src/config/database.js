const { Sequelize } = require('sequelize'); // Carrega as variáveis de ambiente do arquivo .env para o process.env

require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'unodb', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || '2706', // Mudar a senha 
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false // Para não encher o console com logs de SQL
  }
);

module.exports = sequelize; // Exporta a instância do Sequelize para ser usada em outros arquivos