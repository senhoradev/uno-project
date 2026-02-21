const { createServer } = require('node:http');
const app = require('./app'); 
const sequelize = require('./config/database');
const { createDatabaseIfNotExists } = require('./config/database');
const cardService = require('./services/cardService');
const initSocket = require('./config/socket');

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

const app_PORT = process.env.APP_PORT || 3000;

// Criar servidor HTTP a partir do Express (padrao do professor para Socket.IO)
const server = createServer(app);

// Inicializar Socket.IO no servidor HTTP
const io = initSocket(server);

// Exportar io para uso em outros modulos (controllers, services, etc.)
app.set('io', io);

// Primeiro cria o banco se não existir, depois sincroniza e inicia o servidor
createDatabaseIfNotExists()
  .then(() => sequelize.sync()) // Use { alter: true } apenas se precisar alterar a estrutura
  .then(async () => {
    console.log('Banco de dados conectado e sincronizado.');
    
    await cardService.initCards();

    server.listen(app_PORT, () => {
      console.log(`Servidor rodando em http://localhost:${app_PORT}`);
      console.log(`WebSocket (Socket.IO) ativo na mesma porta ${app_PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao conectar ao banco de dados:', error);
  });
