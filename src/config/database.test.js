/**
 * @fileoverview Configuração do Sequelize para ambiente de testes
 * @module config/database.test
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Usar SQLite em memória para testes (não precisa de servidor MySQL rodando)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:', // Banco em memória - rápido e sem dependências
  logging: false, // Desabilita logs no teste
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
