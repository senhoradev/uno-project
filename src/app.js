const express = require('express');
const playerRoutes = require('./routes/playerRoutes');
const cardRoutes = require('./routes/cardRoutes');
const scoringHistoryRoutes = require('./routes/scoringHistoryRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// Middleware
app.use(express.json());

// Definição de Rotas
app.use('/api/players', playerRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/scoring-history', scoringHistoryRoutes);
app.use('/api/games', gameRoutes);

// Exportamos o 'app' para que o server.js ou arquivos de teste possam usá-lo
module.exports = app;