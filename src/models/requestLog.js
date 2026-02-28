const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.selector');

/**
 * @fileoverview Define o modelo RequestLog para rastreamento de requisições HTTP.
 * Armazena dados como endpoint, método HTTP, status code, tempo de resposta, timestamp e userId.
 * @module models/requestLog
 */

/**
 * Modelo RequestLog para rastreamento de requisições à API
 * Armazena métricas e informações de cada requisição recebida
 */
const RequestLog = sequelize.define('RequestLog', {
  endpointAccess: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Endpoint acessado (ex: /api/users)'
  },
  requestMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Método HTTP utilizado (GET, POST, PUT, DELETE)'
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Código de status HTTP da resposta (ex: 200, 404, 500)'
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Tempo de resposta em milissegundos'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Data e hora da requisição'
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Identificador do usuário que fez a requisição (se autenticado)'
  }
}, {
  tableName: 'request_logs',
  timestamps: false
});

module.exports = RequestLog;
