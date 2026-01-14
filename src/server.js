// src/server.js
const app = require('./app'); 
const sequelize = require('./config/database');
const cardService = require('./services/cardService'); // importing cardService

const PORT = 3000;


sequelize.sync() //sync the bank and then start the server
  .then(async () => { // async to use await inside
    console.log('Banco de dados conectado e sincronizado.');
    

    await cardService.initCards(); // Initialize cards if none exist

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao conectar ao banco de dados:', error);
  });