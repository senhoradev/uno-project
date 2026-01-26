const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'unodb';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '1214@Vgala';
const DB_HOST = process.env.DB_HOST || 'localhost';

/**
 * Cria o banco de dados se não existir
 * @async
 * @returns {Promise<void>}
 */
async function createDatabaseIfNotExists() {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`Banco de dados '${DB_NAME}' verificado/criado com sucesso.`);
    await connection.end();
  } catch (error) {
    console.error('Erro ao criar banco de dados:', error.message);
    throw error;
  }
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize;
module.exports.createDatabaseIfNotExists = createDatabaseIfNotExists;