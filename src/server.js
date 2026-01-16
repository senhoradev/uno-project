const app = require('./app'); 
const sequelize = require('./config/database');
const { createDatabaseIfNotExists } = require('./config/database');
const cardService = require('./services/cardService');

const PORT = process.env.PORT || 3000;

// Primeiro cria o banco se não existir, depois sincroniza e inicia o servidor
createDatabaseIfNotExists()
  .then(() => sequelize.sync())
  .then(async () => {
    console.log('Banco de dados conectado e sincronizado.');
    
    await cardService.initCards();

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao conectar ao banco de dados:', error);
  });