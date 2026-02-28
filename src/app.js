/**
 * @fileoverview Configuração principal da aplicação Express.
 * Define middlewares e rotas da API.
 * @module app
 */

const express = require('express');

// Importação dos middlewares
const requestTracking = require('./middlewares/requestTracking');

// Importação das rotas da aplicação
const signUpRoutes = require('./routes/signUpRoutes');
const loginRoutes = require('./routes/loginRoutes');
const playerRoutes = require('./routes/playerRoutes');
const cardRoutes = require('./routes/cardRoutes');
const scoringHistoryRoutes = require('./routes/scoringHistoryRoutes');
const gameRoutes = require('./routes/gameRoutes');
const requestLogRoutes = require('./routes/requestLogRoutes');

/**
 * Instância da aplicação Express.
 * @type {express.Application}
 */
const app = express();

// Middleware
// Habilita o parsing de JSON no corpo das requisições para facilitar o tratamento de dados
app.use(express.json());

// Middleware de rastreamento de requisições
// Captura métricas de todas as requisições (endpoint, método, status, tempo de resposta)
app.use(requestTracking);

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
// Rota para estatísticas de requisições
app.use('/api/stats', requestLogRoutes);

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack); // Loga o erro no console para depuração

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
});

// Exportamos o 'app' para que o server.js ou arquivos de teste possam usá-lo
module.exports = app;