const scoringHistoryController = require('../../src/controllers/scoringHistoryController');
const scoringHistoryService = require('../../src/services/scoringHistoryService');
const Result = require('../../src/utils/Result');

jest.mock('../../src/services/scoringHistoryService');

describe('ScoringHistoryController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('retorna 201 quando criação bem-sucedida', async () => {
      const mockScore = { id: 1, score: 100, playerId: 1, gameId: 1 };
      scoringHistoryService.createScore.mockResolvedValue(Result.success(mockScore));

      req.body = { score: 100, playerId: 1, gameId: 1 };

      await scoringHistoryController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockScore);
    });

    test('retorna 400 quando validação falha', async () => {
      const mockError = { message: 'Score obrigatório', code: 'VALIDATION_ERROR' };
      scoringHistoryService.createScore.mockResolvedValue(Result.failure(mockError));

      req.body = {};

      await scoringHistoryController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Score obrigatório',
        code: 'VALIDATION_ERROR'
      }));
    });
  });

  describe('getById', () => {
    test('retorna 200 quando score existe', async () => {
      const mockScore = { id: 1, score: 100 };
      scoringHistoryService.getScoreById.mockResolvedValue(Result.success(mockScore));

      req.params.id = 1;

      await scoringHistoryController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockScore);
    });

    test('retorna 404 quando score não existe', async () => {
      const mockError = { message: 'Score não encontrado', code: 'NOT_FOUND' };
      scoringHistoryService.getScoreById.mockResolvedValue(Result.failure(mockError));

      req.params.id = 999;

      await scoringHistoryController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    test('retorna 200 quando atualização bem-sucedida', async () => {
      const mockScore = { id: 1, score: 200 };
      scoringHistoryService.updateScore.mockResolvedValue(Result.success(mockScore));

      req.params.id = 1;
      req.body = { score: 200 };

      await scoringHistoryController.update(req, res);

      expect(res.json).toHaveBeenCalledWith(mockScore);
    });

    test('retorna 404 quando score não existe', async () => {
      const mockError = { message: 'Score não encontrado', code: 'NOT_FOUND' };
      scoringHistoryService.updateScore.mockResolvedValue(Result.failure(mockError));

      req.params.id = 999;
      req.body = { score: 200 };

      await scoringHistoryController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    test('retorna 200 quando remoção bem-sucedida', async () => {
      const mockResult = { message: 'Score removido com sucesso' };
      scoringHistoryService.deleteScore.mockResolvedValue(Result.success(mockResult));

      req.params.id = 1;

      await scoringHistoryController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getAll', () => {
    test('retorna 200 com lista de scores', async () => {
      const mockScores = [{ id: 1, score: 100 }, { id: 2, score: 200 }];
      scoringHistoryService.getAllScores.mockResolvedValue(Result.success(mockScores));

      await scoringHistoryController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(mockScores);
    });
  });

  describe('getByGameId', () => {
    test('retorna scores do jogo', async () => {
      const mockScores = [{ id: 1, score: 100, gameId: 1 }];
      scoringHistoryService.getScoresByGameId.mockResolvedValue(Result.success(mockScores));

      req.params.gameId = 1;

      await scoringHistoryController.getByGameId(req, res);

      expect(res.json).toHaveBeenCalledWith(mockScores);
    });
  });

  describe('getByPlayerId', () => {
    test('retorna scores do jogador', async () => {
      const mockScores = [{ id: 1, score: 100, playerId: 1 }];
      scoringHistoryService.getScoresByPlayerId.mockResolvedValue(Result.success(mockScores));

      req.params.playerId = 1;

      await scoringHistoryController.getByPlayerId(req, res);

      expect(res.json).toHaveBeenCalledWith(mockScores);
    });
  });
});
