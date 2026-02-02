/**
 * @fileoverview Configuração do Sequelize para ambiente de testes
 * @module config/database.test
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Usar banco de testes separado
const sequelize = new Sequelize(
  process.env.DB_NAME_TEST || 'uno_db_test',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Desabilita logs no teste
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
