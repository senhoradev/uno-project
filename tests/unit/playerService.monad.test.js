const playerService = require('../../src/services/playerService');
const playerRepository = require('../../src/repository/PlayerRepository');
const Player = require('../../src/models/player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Result = require('../../src/utils/Result');

jest.mock('../../src/repository/PlayerRepository');
jest.mock('../../src/models/player');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('PlayerService com Result Monad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePassword', () => {
    test('retorna Success para senha válida', () => {
      const result = playerService.validatePassword('senha123');
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('senha123');
    });

    test('retorna Failure se senha inválida', () => {
      const result = playerService.validatePassword('123');
      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('retorna Failure se senha undefined', () => {
      const result = playerService.validatePassword();
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('createPlayer', () => {
    test('cria jogador com sucesso quando dados válidos', async () => {
      playerRepository.existsByEmail.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      playerRepository.save.mockResolvedValue({ id: 1 });

      const result = await playerService.createPlayer({
        username: 'test',
        email: 'test@test.com',
        password: 'password123'
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.username).toBe('test');
      expect(result.value.email).toBe('test@test.com');
    });

    test('retorna Failure quando senha inválida', async () => {
      const result = await playerService.createPlayer({
        username: 'test',
        email: 'test@test.com',
        password: '123'
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(playerRepository.existsByEmail).not.toHaveBeenCalled();
    });

    test('retorna Failure quando email já existe', async () => {
      playerRepository.existsByEmail.mockResolvedValue(true);

      const result = await playerService.createPlayer({
        username: 'test',
        email: 'existing@test.com',
        password: 'password123'
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('CONFLICT');
      expect(result.error.message).toBe('User already exists');
    });

    test('retorna Failure quando banco de dados falha', async () => {
      playerRepository.existsByEmail.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue('hashed');
      playerRepository.save.mockRejectedValue(new Error('DB Error'));

      const result = await playerService.createPlayer({
        username: 'test',
        email: 'test@test.com',
        password: 'password123'
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('login', () => {
    test('retorna Success com token quando credenciais válidas', async () => {
      const mockPlayer = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        password: 'hashedPassword'
      };

      Player.findOne.mockResolvedValue(mockPlayer);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const result = await playerService.login('test', 'password123');

      expect(result.isSuccess).toBe(true);
      expect(result.value.access_token).toBe('mock-jwt-token');
    });

    test('retorna Failure quando usuário não existe', async () => {
      Player.findOne.mockResolvedValue(null);

      const result = await playerService.login('inexistente', 'password');

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    test('retorna Failure quando senha incorreta', async () => {
      Player.findOne.mockResolvedValue({ id: 1, password: 'hashed' });
      bcrypt.compare.mockResolvedValue(false);

      const result = await playerService.login('test', 'wrong');

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    test('retorna Failure quando ocorre erro no banco', async () => {
      Player.findOne.mockRejectedValue(new Error('DB Error'));

      const result = await playerService.login('test', 'password');

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('AUTH_ERROR');
    });
  });

  describe('getProfile', () => {
    test('retorna perfil com sucesso quando token válido', async () => {
      jwt.verify.mockReturnValue({ id: 1 });
      playerRepository.findById.mockResolvedValue({
        id: 1,
        username: 'test',
        email: 'test@test.com'
      });

      const result = await playerService.getProfile('valid-token');

      expect(result.isSuccess).toBe(true);
      expect(result.value.username).toBe('test');
      expect(result.value.email).toBe('test@test.com');
    });

    test('retorna Failure quando token inválido', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });

      const result = await playerService.getProfile('invalid-token');

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    test('usa map (Functor) para transformar DTO', async () => {
      jwt.verify.mockReturnValue({ id: 1 });
      playerRepository.findById.mockResolvedValue({
        id: 1,
        username: 'user',
        email: 'user@test.com'
      });

      const result = await playerService.getProfile('token');

      expect(result.value.id).toBeUndefined();
      expect(result.value.username).toBe('user');
    });
  });

  describe('getPlayerById', () => {
    test('retorna Success quando jogador existe', async () => {
      playerRepository.findById.mockResolvedValue({
        id: 1,
        username: 'test',
        email: 'test@test.com'
      });

      const result = await playerService.getPlayerById(1);

      expect(result.isSuccess).toBe(true);
      expect(result.value.username).toBe('test');
    });

    test('retorna Failure quando jogador não existe', async () => {
      playerRepository.findById.mockResolvedValue(null);

      const result = await playerService.getPlayerById(999);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });

    test('retorna Failure quando banco falha', async () => {
      playerRepository.findById.mockRejectedValue(new Error('DB Error'));

      const result = await playerService.getPlayerById(1);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('updatePlayer - Railway-Oriented Programming', () => {
    test('atualiza com sucesso usando composição flatMap', async () => {
      playerRepository.findById.mockResolvedValue({
        id: 1,
        username: 'old',
        email: 'old@test.com'
      });
      playerRepository.update.mockResolvedValue({});

      const result = await playerService.updatePlayer(1, {
        username: 'new',
        email: 'new@test.com'
      });

      expect(result.isSuccess).toBe(true);
    });

    test('Railway: falha na busca propaga erro', async () => {
      playerRepository.findById.mockResolvedValue(null);

      const result = await playerService.updatePlayer(999, { username: 'test' });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
      expect(playerRepository.update).not.toHaveBeenCalled();
    });

    test('valida e faz hash da nova senha', async () => {
      playerRepository.findById.mockResolvedValue({ id: 1 });
      bcrypt.hash.mockResolvedValue('newHashed');
      playerRepository.update.mockResolvedValue({});

      const result = await playerService.updatePlayer(1, {
        username: 'user',
        email: 'user@test.com',
        password: 'newpass123'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
      expect(result.isSuccess).toBe(true);
    });

    test('retorna Failure quando senha nova é inválida', async () => {
      playerRepository.findById.mockResolvedValue({ id: 1 });

      const result = await playerService.updatePlayer(1, {
        username: 'user',
        email: 'user@test.com',
        password: '123'
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('retorna Failure quando update falha', async () => {
      playerRepository.findById.mockResolvedValue({ id: 1 });
      playerRepository.update.mockRejectedValue(new Error('Update failed'));

      const result = await playerService.updatePlayer(1, {
        username: 'new',
        email: 'new@test.com'
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('deletePlayer - flatMap composition', () => {
    test('remove jogador com sucesso', async () => {
      playerRepository.findById.mockResolvedValue({ id: 1 });
      playerRepository.deleteById.mockResolvedValue(true);

      const result = await playerService.deletePlayer(1);

      expect(result.isSuccess).toBe(true);
      expect(result.value.message).toBe('Jogador removido com sucesso');
    });

    test('Railway: falha se jogador não existe', async () => {
      playerRepository.findById.mockResolvedValue(null);

      const result = await playerService.deletePlayer(999);

      expect(result.isSuccess).toBe(false);
      expect(playerRepository.deleteById).not.toHaveBeenCalled();
    });

    test('retorna Failure quando delete falha', async () => {
      playerRepository.findById.mockResolvedValue({ id: 1 });
      playerRepository.deleteById.mockRejectedValue(new Error('Delete failed'));

      const result = await playerService.deletePlayer(1);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('getAllPlayers', () => {
    test('retorna lista de jogadores', async () => {
      const mockPlayers = [
        { id: 1, username: 'user1', email: 'user1@test.com', createdAt: new Date() },
        { id: 2, username: 'user2', email: 'user2@test.com', createdAt: new Date() }
      ];

      Player.findAll.mockResolvedValue(mockPlayers);

      const result = await playerService.getAllPlayers();

      expect(result).toEqual(mockPlayers);
      expect(result.length).toBe(2);
    });
  });
});
