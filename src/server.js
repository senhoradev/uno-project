// src/server.js
const app = require('./app'); // Importa a configuração do app.js
const sequelize = require('./config/database');

const PORT = 3000;

// Sincronizamos o banco, depois ligamos o servidor
sequelize.sync()
  .then(() => {
    console.log('Banco de dados conectado e sincronizado.');
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao conectar ao banco de dados:', error);
  });