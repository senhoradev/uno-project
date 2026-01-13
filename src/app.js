// src/app.js
const express = require('express');
const playerRoutes = require('./routes/playerRoutes');

const app = express();

// Middleware
app.use(express.json());

// Definição de Rotas
app.use('/api/players', playerRoutes);

// Exportamos o 'app' para que o server.js ou arquivos de teste possam usá-lo
module.exports = app;