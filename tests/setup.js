/**
 * @fileoverview Configuração global para testes
 * @module tests/setup
 */

// Define timeout padrão para testes (30 segundos)
jest.setTimeout(30000);

// Configurações globais do ambiente de teste
process.env.NODE_ENV = 'test';

// Fecha todas as conexões do Sequelize após todos os testes
afterAll(async () => {
  try {
    const sequelize = require('../src/config/database.test');
    if (sequelize && typeof sequelize.close === 'function') {
      await sequelize.close();
    }
  } catch (error) {
    // Ignora erros se já estiver fechado
  }
});

// Mock console para evitar poluição de logs durante testes
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
