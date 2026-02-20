/**
 * @fileoverview Helper para configurar modelos e associações nos testes
 * @module tests/helpers/setupModels
 */

const { Sequelize } = require('sequelize');
const sequelize = require('../../src/config/database.test');
const Player = require('../../src/models/player');
const Game = require('../../src/models/game');
const GamePlayer = require('../../src/models/gamePlayer');
const Card = require('../../src/models/card');
const ScoringHistory = require('../../src/models/scoringHistory');
require('dotenv').config();

// Configurar as associações apenas se ainda não foram configuradas e se não estão mockadas
try {
  if (!GamePlayer.associations || Object.keys(GamePlayer.associations).length === 0) {
    if (typeof GamePlayer.belongsTo === 'function') {
      GamePlayer.belongsTo(Player, { foreignKey: 'playerId' });
      GamePlayer.belongsTo(Game, { foreignKey: 'gameId' });
      Player.hasMany(GamePlayer, { foreignKey: 'playerId' });
      Game.hasMany(GamePlayer, { foreignKey: 'gameId' });
    }
  }
} catch (error) {
  // Ignora erros de associação quando modelos estão mockados
}

/**
 * Cria o banco de dados de teste se não existir
 * Para SQLite em memória, não precisa criar banco
 */
async function createTestDatabaseIfNotExists() {
  // SQLite em memória não precisa criar banco
  // Esta função fica vazia mas mantemos para compatibilidade
  return Promise.resolve();
}

/**
 * Sincroniza o banco de dados para testes
 * Remove e recria todas as tabelas
 */
async function setupTestDatabase() {
  await createTestDatabaseIfNotExists();
  // SQLite não precisa de FOREIGN_KEY_CHECKS
  await sequelize.sync({ force: true });
}

/**
 * Limpa todas as tabelas mas mantém a estrutura
 */
async function cleanDatabase() {
  try {
    // SQLite permite truncar diretamente
    await Card.destroy({ where: {}, truncate: true, cascade: true });
    await GamePlayer.destroy({ where: {}, truncate: true, cascade: true });
    await Game.destroy({ where: {}, truncate: true, cascade: true });
    await Player.destroy({ where: {}, truncate: true, cascade: true });
    await ScoringHistory.destroy({ where: {}, truncate: true, cascade: true });
  } catch (err) {
    console.error("Erro na limpeza:", err);
  }
}
/**
 * Fecha a conexão com o banco
 */
async function closeDatabase() {
  await sequelize.close();
}

module.exports = {
  sequelize,
  setupTestDatabase,
  cleanDatabase,
  closeDatabase,
  Player,
  Game,
  GamePlayer,
  ScoringHistory,
  Card
};
