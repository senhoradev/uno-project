/**
 * @fileoverview Testes unitários para operações CRUD de Players
 * @module tests/unit/player.test
 */

const {
  Player,
  setupTestDatabase,
  cleanDatabase,
  closeDatabase
} = require('../helpers/setupModels');

describe('Player CRUD Operations', () => {
  
  // Configuração antes de todos os testes
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // Limpeza após todos os testes
  afterAll(async () => {
    await closeDatabase();
  });

  // Limpa a tabela antes de cada teste
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('CREATE - Criar novo jogador', () => {
    test('Deve criar um novo jogador com sucesso', async () => {
      const playerData = {
        username: 'test_player',
        email: 'test@email.com',
        password: 'senha123',
        name: 'Test Player',
        age: 25
      };

      const player = await Player.create(playerData);

      expect(player).toBeDefined();
      expect(player.id).toBeDefined();
      expect(player.username).toBe(playerData.username);
      expect(player.email).toBe(playerData.email);
      expect(player.name).toBe(playerData.name);
      expect(player.age).toBe(playerData.age);
    });

    test('Deve falhar ao criar jogador com email duplicado', async () => {
      const playerData = {
        username: 'player1',
        email: 'duplicate@email.com',
        password: 'senha123',
        name: 'Player One',
        age: 20
      };

      await Player.create(playerData);

      await expect(
        Player.create({
          username: 'player2',
          email: 'duplicate@email.com', // Email duplicado
          password: 'senha456',
          name: 'Player Two',
          age: 22
        })
      ).rejects.toThrow();
    });

    test('Deve falhar ao criar jogador sem campos obrigatórios', async () => {
      await expect(
        Player.create({
          username: 'incomplete_player'
          // Faltando campos obrigatórios
        })
      ).rejects.toThrow();
    });
  });

  describe('READ - Buscar jogadores', () => {
    test('Deve buscar um jogador por ID', async () => {
      const playerData = {
        username: 'find_player',
        email: 'find@email.com',
        password: 'senha123',
        name: 'Find Player',
        age: 30
      };

      const createdPlayer = await Player.create(playerData);
      const foundPlayer = await Player.findByPk(createdPlayer.id);

      expect(foundPlayer).toBeDefined();
      expect(foundPlayer.id).toBe(createdPlayer.id);
      expect(foundPlayer.username).toBe(playerData.username);
    });

    test('Deve retornar null ao buscar jogador inexistente', async () => {
      const foundPlayer = await Player.findByPk(9999);
      expect(foundPlayer).toBeNull();
    });

    test('Deve listar todos os jogadores', async () => {
      await Player.create({
        username: 'player1',
        email: 'player1@email.com',
        password: 'senha123',
        name: 'Player One',
        age: 20
      });

      await Player.create({
        username: 'player2',
        email: 'player2@email.com',
        password: 'senha456',
        name: 'Player Two',
        age: 25
      });

      const players = await Player.findAll();
      expect(players).toHaveLength(2);
    });
  });

  describe('UPDATE - Atualizar jogador', () => {
    test('Deve atualizar informações do jogador com sucesso', async () => {
      const player = await Player.create({
        username: 'update_player',
        email: 'update@email.com',
        password: 'senha123',
        name: 'Update Player',
        age: 28
      });

      await player.update({
        name: 'Updated Name',
        age: 29
      });

      const updatedPlayer = await Player.findByPk(player.id);
      expect(updatedPlayer.name).toBe('Updated Name');
      expect(updatedPlayer.age).toBe(29);
      expect(updatedPlayer.username).toBe('update_player'); // Não alterado
    });

    test('Deve atualizar apenas campos fornecidos', async () => {
      const player = await Player.create({
        username: 'partial_update',
        email: 'partial@email.com',
        password: 'senha123',
        name: 'Partial Player',
        age: 26
      });

      const originalAge = player.age;
      await player.update({ name: 'New Name Only' });

      const updatedPlayer = await Player.findByPk(player.id);
      expect(updatedPlayer.name).toBe('New Name Only');
      expect(updatedPlayer.age).toBe(originalAge); // Não alterado
    });
  });

  describe('DELETE - Deletar jogador', () => {
    test('Deve deletar um jogador com sucesso', async () => {
      const player = await Player.create({
        username: 'delete_player',
        email: 'delete@email.com',
        password: 'senha123',
        name: 'Delete Player',
        age: 24
      });

      const playerId = player.id;
      await player.destroy();

      const deletedPlayer = await Player.findByPk(playerId);
      expect(deletedPlayer).toBeNull();
    });

    test('Deve retornar 0 ao tentar deletar jogador inexistente', async () => {
      const result = await Player.destroy({ where: { id: 9999 } });
      expect(result).toBe(0);
    });
  });
});
