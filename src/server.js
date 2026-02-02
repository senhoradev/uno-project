const app = require('./app'); 
const sequelize = require('./config/database');
const { createDatabaseIfNotExists } = require('./config/database');
const cardService = require('./services/cardService');

// Importar os models para configurar as associações
const Player = require('./models/player');
const Game = require('./models/game');
const GamePlayer = require('./models/gamePlayer');
const Card = require('./models/card');

// Configurar as associações entre os models
GamePlayer.belongsTo(Player, { foreignKey: 'playerId' });
GamePlayer.belongsTo(Game, { foreignKey: 'gameId' });
Player.hasMany(GamePlayer, { foreignKey: 'playerId' });
Game.hasMany(GamePlayer, { foreignKey: 'gameId' });

const PORT = process.env.PORT || 3000;

// Primeiro cria o banco se não existir, depois sincroniza e inicia o servidor
createDatabaseIfNotExists()
  .then(() => sequelize.sync()) // Use { alter: true } apenas se precisar alterar a estrutura
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