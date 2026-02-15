const PlayerRepository = require('../../src/repository/PlayerRepository');
const Player = require('../../src/models/player');

jest.mock('../../src/models/player');

describe('PlayerRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    test('retorna jogador quando encontrado', async () => {
      const mockPlayer = { id: 1, username: 'test', email: 'test@test.com' };
      Player.findByPk.mockResolvedValue(mockPlayer);

      const result = await PlayerRepository.findById(1);

      expect(result).toEqual(mockPlayer);
      expect(Player.findByPk).toHaveBeenCalledWith(1);
    });

    test('retorna null quando não encontrado', async () => {
      Player.findByPk.mockResolvedValue(null);

      const result = await PlayerRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('existsByEmail', () => {
    test('retorna true quando email existe', async () => {
      Player.count.mockResolvedValue(1);

      const result = await PlayerRepository.existsByEmail('test@test.com');

      expect(result).toBe(true);
    });

    test('retorna false quando email não existe', async () => {
      Player.count.mockResolvedValue(0);

      const result = await PlayerRepository.existsByEmail('new@test.com');

      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    test('salva novo jogador', async () => {
      const mockPlayer = { id: 1, username: 'test', email: 'test@test.com' };
      Player.create.mockResolvedValue(mockPlayer);

      const playerData = { username: 'test', email: 'test@test.com', password: 'hashed' };
      const result = await PlayerRepository.save(playerData);

      expect(result).toEqual(mockPlayer);
      expect(Player.create).toHaveBeenCalledWith(playerData);
    });
  });

  describe('update', () => {
    test('atualiza jogador existente', async () => {
      const mockPlayer = {
        id: 1,
        username: 'old',
        update: jest.fn().mockResolvedValue({ id: 1, username: 'new' })
      };
      Player.findByPk.mockResolvedValue(mockPlayer);

      const result = await PlayerRepository.update(1, { username: 'new' });

      expect(mockPlayer.update).toHaveBeenCalledWith({ username: 'new' });
    });
  });

  describe('deleteById', () => {
    test('remove jogador', async () => {
      Player.destroy.mockResolvedValue(1);

      await PlayerRepository.deleteById(1);

      expect(Player.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('findAll', () => {
    test('retorna todos os jogadores', async () => {
      const mockPlayers = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];
      Player.findAll.mockResolvedValue(mockPlayers);

      const result = await PlayerRepository.findAll();

      expect(result).toEqual(mockPlayers);
    });
  });
});
