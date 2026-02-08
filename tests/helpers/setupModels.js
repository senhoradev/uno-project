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
require('dotenv').config();

// Configurar as associações
GamePlayer.belongsTo(Player, { foreignKey: 'playerId' });
GamePlayer.belongsTo(Game, { foreignKey: 'gameId' });
Player.hasMany(GamePlayer, { foreignKey: 'playerId' });
Game.hasMany(GamePlayer, { foreignKey: 'gameId' });

/**
 * Cria o banco de dados de teste se não existir
 */
async function createTestDatabaseIfNotExists() {
  const tempSequelize = new Sequelize('', 
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: false
    }
  );

  try {
    const dbName = process.env.DB_NAME_TEST || 'uno_db_test';
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Banco de dados de teste '${dbName}' criado ou já existe.`);
  } catch (error) {
    console.error('Erro ao criar banco de dados de teste:', error);
    throw error;
  } finally {
    await tempSequelize.close();
  }
}

/**
 * Sincroniza o banco de dados para testes
 * Remove e recria todas as tabelas
 */
async function setupTestDatabase() {
  await createTestDatabaseIfNotExists();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.sync({ force: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Limpa todas as tabelas mas mantém a estrutura
 */
async function cleanDatabase() {
  // Desativar checks de FK para permitir limpeza total
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  
  try {
    // A ordem de destruição importa menos com FOREIGN_KEY_CHECKS = 0, 
    // mas a limpeza deve ser completa
    await Card.destroy({ where: {}, force: true });
    await GamePlayer.destroy({ where: {}, force: true });
    await Game.destroy({ where: {}, force: true });
    await Player.destroy({ where: {}, force: true });
    
    // Opcional: Reiniciar os auto-incrementos para IDs previsíveis
    await sequelize.query('ALTER TABLE Players AUTO_INCREMENT = 1');
    await sequelize.query('ALTER TABLE Games AUTO_INCREMENT = 1');
  } catch (err) {
    console.error("Erro na limpeza crítica:", err);
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
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
  Card
};
