/**
 * @fileoverview Testes unitários para operações CRUD de Games
 * @module tests/unit/game.test
 */

const {
  Game,
  Player,
  setupTestDatabase,
  cleanDatabase,
  closeDatabase
} = require('../helpers/setupModels');

describe('Game CRUD Operations', () => {
  
  let testPlayer;

  // Configuração antes de todos os testes
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // Limpeza após todos os testes
  afterAll(async () => {
    await closeDatabase();
  });

  // Limpa as tabelas e cria um jogador de teste antes de cada teste
  beforeEach(async () => {
    await cleanDatabase();
    
    testPlayer = await Player.create({
      username: 'game_creator',
      email: 'creator@email.com',
      password: 'senha123',
      name: 'Game Creator',
      age: 25
    });
  });

  describe('CREATE - Criar novo jogo', () => {
    test('Deve criar um novo jogo com sucesso', async () => {
      const gameData = {
        name: 'Test Game',
        rules: 'Test rules',
        maxPlayers: 4,
        creatorId: testPlayer.id,
        status: 'waiting'
      };

      const game = await Game.create(gameData);

      expect(game).toBeDefined();
      expect(game.id).toBeDefined();
      expect(game.name).toBe(gameData.name);
      expect(game.rules).toBe(gameData.rules);
      expect(game.maxPlayers).toBe(gameData.maxPlayers);
      expect(game.status).toBe(gameData.status);
    });

    test('Deve criar jogo com valores padrão', async () => {
      const game = await Game.create({
        name: 'Simple Game',
        creatorId: testPlayer.id
      });

      expect(game.maxPlayers).toBe(4); // Valor padrão
      expect(game.status).toBe('waiting'); // Valor padrão
    });

    test('Deve falhar ao criar jogo com nome vazio', async () => {
      await expect(
        Game.create({
          name: '',
          creatorId: testPlayer.id
        })
      ).rejects.toThrow();
    });

    test('Deve falhar ao criar jogo com maxPlayers inválido', async () => {
      await expect(
        Game.create({
          name: 'Invalid Game',
          maxPlayers: 15, // Maior que o máximo permitido (10)
          creatorId: testPlayer.id
        })
      ).rejects.toThrow();
    });

    test('Deve falhar ao criar jogo com status inválido', async () => {
      await expect(
        Game.create({
          name: 'Invalid Status Game',
          status: 'invalid_status',
          creatorId: testPlayer.id
        })
      ).rejects.toThrow();
    });
  });

  describe('READ - Buscar jogos', () => {
    test('Deve buscar um jogo por ID', async () => {
      const gameData = {
        name: 'Find Game',
        creatorId: testPlayer.id
      };

      const createdGame = await Game.create(gameData);
      const foundGame = await Game.findByPk(createdGame.id);

      expect(foundGame).toBeDefined();
      expect(foundGame.id).toBe(createdGame.id);
      expect(foundGame.name).toBe(gameData.name);
    });

    test('Deve retornar null ao buscar jogo inexistente', async () => {
      const foundGame = await Game.findByPk(9999);
      expect(foundGame).toBeNull();
    });

    test('Deve listar todos os jogos', async () => {
      await Game.create({
        name: 'Game 1',
        creatorId: testPlayer.id
      });

      await Game.create({
        name: 'Game 2',
        creatorId: testPlayer.id
      });

      const games = await Game.findAll();
      expect(games).toHaveLength(2);
    });

    test('Deve buscar jogos por status', async () => {
      const waitingGame = await Game.create({
        name: 'Waiting Game',
        status: 'waiting',
        creatorId: testPlayer.id
      });

      const startedGame = await Game.create({
        name: 'Started Game',
        status: 'started',
        creatorId: testPlayer.id
      });

      const waitingGames = await Game.findAll({ where: { status: 'waiting' } });
      expect(waitingGames.length).toBeGreaterThanOrEqual(1);
      expect(waitingGames.some(g => g.name === 'Waiting Game')).toBe(true);
    });
  });

  describe('UPDATE - Atualizar jogo', () => {
    test('Deve atualizar informações do jogo com sucesso', async () => {
      const game = await Game.create({
        name: 'Update Game',
        maxPlayers: 4,
        creatorId: testPlayer.id
      });

      await game.update({
        name: 'Updated Game',
        maxPlayers: 6,
        status: 'started'
      });

      const updatedGame = await Game.findByPk(game.id);
      expect(updatedGame.name).toBe('Updated Game');
      expect(updatedGame.maxPlayers).toBe(6);
      expect(updatedGame.status).toBe('started');
    });

    test('Deve atualizar apenas o status do jogo', async () => {
      const game = await Game.create({
        name: 'Status Update Game',
        creatorId: testPlayer.id
      });

      const originalName = game.name;
      const gameId = game.id;
      
      await game.update({ status: 'finished' });
      await game.reload(); // Recarrega o objeto do banco

      expect(game.status).toBe('finished');
      expect(game.name).toBe(originalName);
    });

    test('Deve falhar ao atualizar com status inválido', async () => {
      const game = await Game.create({
        name: 'Invalid Update',
        creatorId: testPlayer.id
      });

      await expect(
        game.update({ status: 'invalid' })
      ).rejects.toThrow();
    });
  });

  describe('DELETE - Deletar jogo', () => {
    test('Deve deletar um jogo com sucesso', async () => {
      const game = await Game.create({
        name: 'Delete Game',
        creatorId: testPlayer.id
      });

      const gameId = game.id;
      await game.destroy();

      const deletedGame = await Game.findByPk(gameId);
      expect(deletedGame).toBeNull();
    });

    test('Deve retornar 0 ao tentar deletar jogo inexistente', async () => {
      const result = await Game.destroy({ where: { id: 9999 } });
      expect(result).toBe(0);
    });
  });
});
