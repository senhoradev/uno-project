/**
 * @fileoverview Configuração principal da aplicação Express.
 * Define middlewares e rotas da API.
 * @module app
 */

const express = require('express');

// Importação das rotas da aplicação
const signUpRoutes = require('./routes/signUpRoutes');
const loginRoutes = require('./routes/loginRoutes');
const playerRoutes = require('./routes/playerRoutes');
const cardRoutes = require('./routes/cardRoutes');
const scoringHistoryRoutes = require('./routes/scoringHistoryRoutes');
const gameRoutes = require('./routes/gameRoutes');

/**
 * Instância da aplicação Express.
 * @type {express.Application}
 */
const app = express();

// Middleware
// Habilita o parsing de JSON no corpo das requisições para facilitar o tratamento de dados
app.use(express.json());

// Definição de Rotas
// Rota para registro de novos usuários
app.use('/api/signup', signUpRoutes);
// Rota para autenticação (login, logout, perfil)
app.use('/api/auth', loginRoutes);
// Rota para gerenciamento de jogadores (CRUD)
app.use('/api/players', playerRoutes);
// Rota para gerenciamento de cartas do jogo
app.use('/api/cards', cardRoutes);
// Rota para histórico de pontuações
app.use('/api/scoring-history', scoringHistoryRoutes);
// Rota para gerenciamento de partidas/jogos
app.use('/api/games', gameRoutes);

// Exportamos o 'app' para que o server.js ou arquivos de teste possam usá-lo
module.exports = app;