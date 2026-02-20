/**
 * @fileoverview Testes para scoringHistoryService com Result Monad
 * Verifica funcionamento de Functors e Monads no contexto real
 */

const scoringHistoryService = require('../../src/services/scoringHistoryService');
const scoringHistory = require('../../src/models/scoringHistory');
const Result = require('../../src/utils/Result');

// Mock do modelo
jest.mock('../../src/models/scoringHistory');

describe('ScoringHistoryService com Result Monad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateScoreData', () => {
    test('retorna Success para dados válidos', () => {
      const data = { score: 100, playerId: 1, gameId: 1 };
      const result = scoringHistoryService.validateScoreData(data);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(data);
    });

    test('retorna Failure se score for undefined', () => {
      const data = { playerId: 1, gameId: 1 };
      const result = scoringHistoryService.validateScoreData(data);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('A pontuação (score) é obrigatória');
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.field).toBe('score');
    });

    test('retorna Failure se score for null', () => {
      const data = { score: null, playerId: 1 };
      const result = scoringHistoryService.validateScoreData(data);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('A pontuação (score) é obrigatória');
    });

    test('retorna Failure se score não for número', () => {
      const data = { score: "100", playerId: 1 };
      const result = scoringHistoryService.validateScoreData(data);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('A pontuação deve ser um número');
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('createScore', () => {
    test('retorna Success com score criado quando dados válidos', async () => {
      const mockScore = {
        id: 1,
        score: 100,
        playerId: 1,
        gameId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      scoringHistory.create.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.createScore({
        score: 100,
        playerId: 1,
        gameId: 1
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.score).toBe(100);
      expect(result.value.id).toBe(1);
    });

    test('retorna Failure quando validação falha', async () => {
      const result = await scoringHistoryService.createScore({
        playerId: 1,
        gameId: 1
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(scoringHistory.create).not.toHaveBeenCalled();
    });

    test('retorna Failure quando banco falha', async () => {
      scoringHistory.create.mockRejectedValue(new Error('Database error'));

      const result = await scoringHistoryService.createScore({
        score: 100,
        playerId: 1,
        gameId: 1
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toBe('Erro ao criar pontuação no banco de dados');
    });

    test('usa map (Functor) para transformar resultado', async () => {
      const mockScore = {
        id: 1,
        score: 100,
        playerId: 1,
        gameId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        extraField: 'should not appear'
      };

      scoringHistory.create.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.createScore({
        score: 100,
        playerId: 1,
        gameId: 1
      });

      // Verifica que map filtrou apenas campos necessários
      expect(result.value).toHaveProperty('id');
      expect(result.value).toHaveProperty('score');
      expect(result.value).not.toHaveProperty('extraField');
    });
  });

  describe('getScoreById', () => {
    test('retorna Success quando score existe', async () => {
      const mockScore = {
        id: 1,
        score: 100,
        playerId: 1,
        gameId: 1
      };

      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.getScoreById(1);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(mockScore);
      expect(scoringHistory.findByPk).toHaveBeenCalledWith(1);
    });

    test('retorna Failure quando score não existe', async () => {
      scoringHistory.findByPk.mockResolvedValue(null);

      const result = await scoringHistoryService.getScoreById(999);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Score não encontrado');
      expect(result.error.id).toBe(999);
    });

    test('retorna Failure quando banco falha', async () => {
      scoringHistory.findByPk.mockRejectedValue(new Error('Connection error'));

      const result = await scoringHistoryService.getScoreById(1);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('updateScore - demonstra flatMap (Monad)', () => {
    test('atualiza score com sucesso usando composição flatMap', async () => {
      const mockScore = {
        id: 1,
        score: 100,
        update: jest.fn().mockResolvedValue({
          id: 1,
          score: 200,
          playerId: 1,
          gameId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };

      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.updateScore(1, { score: 200 });

      expect(result.isSuccess).toBe(true);
      expect(result.value.score).toBe(200);
      expect(mockScore.update).toHaveBeenCalledWith({ score: 200 });
    });

    test('Railway-Oriented: falha na busca propaga erro', async () => {
      scoringHistory.findByPk.mockResolvedValue(null);

      const result = await scoringHistoryService.updateScore(999, { score: 200 });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
      // Validação não é executada porque busca falhou
    });

    test('Railway-Oriented: falha na validação propaga erro', async () => {
      const mockScore = {
        id: 1,
        score: 100,
        update: jest.fn()
      };

      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.updateScore(1, { score: "invalid" });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      // Update não é executado porque validação falhou
      expect(mockScore.update).not.toHaveBeenCalled();
    });

    test('Railway-Oriented: falha no update propaga erro', async () => {
      const mockScore = {
        id: 1,
        score: 100,
        update: jest.fn().mockRejectedValue(new Error('Update failed'))
      };

      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.updateScore(1, { score: 200 });

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('deleteScore - demonstra flatMap', () => {
    test('remove score com sucesso', async () => {
      const mockScore = {
        id: 1,
        destroy: jest.fn().mockResolvedValue()
      };

      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.deleteScore(1);

      expect(result.isSuccess).toBe(true);
      expect(result.value.message).toBe('Score removido com sucesso');
      expect(result.value.id).toBe(1);
      expect(mockScore.destroy).toHaveBeenCalled();
    });

    test('falha se score não existe', async () => {
      scoringHistory.findByPk.mockResolvedValue(null);

      const result = await scoringHistoryService.deleteScore(999);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });

    test('falha se destroy lança erro', async () => {
      const mockScore = {
        id: 1,
        destroy: jest.fn().mockRejectedValue(new Error('Delete failed'))
      };

      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const result = await scoringHistoryService.deleteScore(1);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('getAllScores', () => {
    test('retorna lista de scores transformada com map', async () => {
      const mockScores = [
        {
          id: 1,
          score: 100,
          playerId: 1,
          gameId: 1,
          createdAt: new Date(),
          extraField: 'should be filtered'
        },
        {
          id: 2,
          score: 200,
          playerId: 2,
          gameId: 1,
          createdAt: new Date(),
          extraField: 'should be filtered'
        }
      ];

      scoringHistory.findAll.mockResolvedValue(mockScores);

      const result = await scoringHistoryService.getAllScores();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value[0]).not.toHaveProperty('extraField');
      expect(result.value[0]).toHaveProperty('score');
    });

    test('retorna Failure se banco falha', async () => {
      scoringHistory.findAll.mockRejectedValue(new Error('Connection error'));

      const result = await scoringHistoryService.getAllScores();

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('Composição complexa - casos reais', () => {
    test('Pipeline completo: criar -> buscar -> atualizar', async () => {
      // Setup para create
      const createdScore = {
        id: 1,
        score: 100,
        playerId: 1,
        gameId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      scoringHistory.create.mockResolvedValue(createdScore);

      // 1. Criar score
      const createResult = await scoringHistoryService.createScore({
        score: 100,
        playerId: 1,
        gameId: 1
      });

      expect(createResult.isSuccess).toBe(true);
      const scoreId = createResult.value.id;

      // Setup para update
      const mockScore = {
        id: scoreId,
        score: 100,
        update: jest.fn().mockResolvedValue({
          id: scoreId,
          score: 150,
          playerId: 1,
          gameId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };
      scoringHistory.findByPk.mockResolvedValue(mockScore);

      // 2. Atualizar score
      const updateResult = await scoringHistoryService.updateScore(scoreId, {
        score: 150
      });

      expect(updateResult.isSuccess).toBe(true);
      expect(updateResult.value.score).toBe(150);
    });

    test('Verifica que erros param na primeira falha (Railway)', async () => {
      // Create vai falhar na validação
      const createResult = await scoringHistoryService.createScore({
        score: "invalid",
        playerId: 1
      });

      expect(createResult.isSuccess).toBe(false);
      expect(scoringHistory.create).not.toHaveBeenCalled();

      // Mesmo que tentemos atualizar, o erro persiste
      // (demonstra que Results podem ser compostos)
    });
  });

  describe('Verificação das Leis de Monad no contexto real', () => {
    test('Left Identity com getScoreById', async () => {
      const mockScore = { id: 1, score: 100 };
      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const f = async (id) => await scoringHistoryService.getScoreById(id);
      
      const left = await Result.success(1).flatMap(f);
      const right = await f(1);

      expect(left.value).toEqual(right.value);
    });

    test('Associatividade com operações do serviço', async () => {
      const mockScore = {
        id: 1,
        score: 100,
        update: jest.fn().mockResolvedValue({
          id: 1,
          score: 200,
          playerId: 1,
          gameId: 1
        })
      };

      scoringHistory.findByPk.mockResolvedValue(mockScore);

      const validate = (data) => scoringHistoryService.validateScoreData(data);
      const update = async (data) => {
        await mockScore.update(data);
        return Result.success(data);
      };

      // (m >>= f) >>= g
      const left = await validate({ score: 200 })
        .flatMap(update);

      // Reset mock
      mockScore.update.mockClear();

      // m >>= (\x -> f x >>= g)
      const right = await validate({ score: 200 })
        .flatMap(async (x) => await update(x));

      expect(left.value).toEqual(right.value);
    });
  });
});
