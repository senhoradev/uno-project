const express = require('express');
const playerRoutes = require('./routes/playerRoutes');
const sequelize = require('./config/database');

const app = express();
app.use(express.json());

// Rotas
app.use('/api/players', playerRoutes);

// Sincronizar banco e iniciar servidor
const PORT = 3000;
sequelize.sync().then(() => {
  console.log('Banco de dados conectado e sincronizado.');
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
});