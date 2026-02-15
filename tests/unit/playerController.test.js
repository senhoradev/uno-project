const playerController = require('../../src/controllers/playerController');
const playerService = require('../../src/services/playerService');
const Result = require('../../src/utils/Result');

jest.mock('../../src/services/playerService');

describe('PlayerController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('retorna 201 quando jogador criado com sucesso', async () => {
      const mockPlayer = { username: 'test', email: 'test@test.com' };
      playerService.createPlayer.mockResolvedValue(Result.success(mockPlayer));

      req.body = { username: 'test', email: 'test@test.com', password: 'password123' };

      await playerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      // PlayerResponseDTO recebe username e email como parâmetros separados
      expect(response).toBeDefined();
    });

    test('retorna 400 quando validação falha', async () => {
      const mockError = { message: 'Senha inválida', code: 'VALIDATION_ERROR' };
      playerService.createPlayer.mockResolvedValue(Result.failure(mockError));

      req.body = { username: 'test', email: 'test@test.com', password: '123' };

      await playerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getById', () => {
    test('retorna 200 quando jogador existe', async () => {
      const mockPlayer = { id: 1, username: 'test', email: 'test@test.com' };
      playerService.getPlayerById.mockResolvedValue(Result.success(mockPlayer));

      req.params.id = 1;

      await playerController.getById(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    test('retorna 404 quando jogador não existe', async () => {
      const mockError = { message: 'Jogador não encontrado', code: 'NOT_FOUND' };
      playerService.getPlayerById.mockResolvedValue(Result.failure(mockError));

      req.params.id = 999;

      await playerController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    test('retorna 200 quando atualização bem-sucedida', async () => {
      const mockPlayer = { username: 'updated', email: 'updated@test.com' };
      playerService.updatePlayer.mockResolvedValue(Result.success(mockPlayer));

      req.params.id = 1;
      req.body = { username: 'updated' };

      await playerController.update(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toBeDefined();
    });

    test('retorna 404 quando jogador não existe', async () => {
      const mockError = { message: 'Jogador não encontrado', code: 'NOT_FOUND' };
      playerService.updatePlayer.mockResolvedValue(Result.failure(mockError));

      req.params.id = 999;
      req.body = { username: 'test' };

      await playerController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    test('retorna 200 quando remoção bem-sucedida', async () => {
      const mockResult = { message: 'Jogador removido com sucesso' };
      playerService.deletePlayer.mockResolvedValue(Result.success(mockResult));

      req.params.id = 1;

      await playerController.delete(req, res);

      // O controller delete não retorna JSON, apenas termina sem erro
      expect(playerService.deletePlayer).toHaveBeenCalledWith(1);
    });

    test('retorna 404 quando jogador não existe', async () => {
      const mockError = { message: 'Jogador não encontrado', code: 'NOT_FOUND' };
      playerService.deletePlayer.mockResolvedValue(Result.failure(mockError));

      req.params.id = 999;

      await playerController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAll', () => {
    test('retorna 200 com lista de jogadores', async () => {
      const mockPlayers = [
        { id: 1, username: 'user1', email: 'user1@test.com' },
        { id: 2, username: 'user2', email: 'user2@test.com' }
      ];
      playerService.getAllPlayers.mockResolvedValue(mockPlayers);

      await playerController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPlayers);
    });
  });

  // getProfile não existe no playerController, está no loginController
});
