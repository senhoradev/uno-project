/**
 * @fileoverview Seleciona a conexão de banco correta baseado no ambiente
 * @module config/database.selector
 */

// Usa database.test em ambiente de teste, database.js em produção/dev
const sequelize = process.env.NODE_ENV === 'test'
  ? require('./database.test')
  : require('./database');

module.exports = sequelize;
