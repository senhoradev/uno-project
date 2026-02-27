const requestLogController = require('../../src/controllers/requestLogController');
const requestLogService = require('../../src/services/requestLogService');
const Result = require('../../src/utils/Result');

jest.mock('../../src/services/requestLogService');

/**
 * @fileoverview Testes unitários para o requestLogController
 * 
 * Testa:
 * - Endpoints de estatísticas
 * - Tratamento de Result Monad
 * - Respostas HTTP corretas
 * - Tratamento de erros
 */

describe('RequestLogController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      body: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getRequestStats - ENDPOINT 1', () => {
    test('retorna estatísticas com sucesso (200)', async () => {
      const mockStats = {
        totalRequests: 1000,
        successfulRequests: 850,
        failedRequests: 150,
        successRate: 85.00,
        failureRate: 15.00,
        requestsByMethod: { GET: 600, POST: 300, PUT: 50, DELETE: 50 },
        authenticatedRequests: 700,
        unauthenticatedRequests: 300
      };

      requestLogService.getRequestStats.mockResolvedValue(Result.success(mockStats));

      await requestLogController.getRequestStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    test('retorna erro de banco de dados (500)', async () => {
      const mockError = {
        message: 'Erro ao buscar logs',
        code: 'DATABASE_ERROR',
        details: 'Connection timeout'
      };

      requestLogService.getRequestStats.mockResolvedValue(Result.failure(mockError));

      await requestLogController.getRequestStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: mockError.message,
        code: mockError.code,
        details: mockError.details
      });
    });

    test('retorna erro de cálculo (400)', async () => {
      const mockError = {
        message: 'Erro ao calcular estatísticas',
        code: 'CALCULATION_ERROR'
      };

      requestLogService.getRequestStats.mockResolvedValue(Result.failure(mockError));

      await requestLogController.getRequestStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getResponseTimeStats - ENDPOINT 2', () => {
    test('retorna estatísticas de tempo de resposta com sucesso', async () => {
      const mockStats = {
        averageResponseTime: 245.67,
        minResponseTime: 10,
        maxResponseTime: 5000,
        medianResponseTime: 200,
        p95ResponseTime: 800,
        p99ResponseTime: 1500,
        totalRequests: 1000,
        timeRanges: {
          fast: 500,
          medium: 350,
          slow: 100,
          verySlow: 50
        }
      };

      requestLogService.getResponseTimeStats.mockResolvedValue(Result.success(mockStats));

      await requestLogController.getResponseTimeStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    test('trata erro do serviço', async () => {
      const mockError = {
        message: 'Erro ao calcular tempos de resposta',
        code: 'CALCULATION_ERROR'
      };

      requestLogService.getResponseTimeStats.mockResolvedValue(Result.failure(mockError));

      await requestLogController.getResponseTimeStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: mockError.message,
        code: mockError.code,
        details: undefined
      });
    });
  });

  describe('getStatusCodeStats - ENDPOINT 3', () => {
    test('retorna estatísticas de status codes com sucesso', async () => {
      const mockStats = {
        totalRequests: 1000,
        statusCodeDistribution: [
          { statusCode: 200, count: 700, percentage: '70.00' },
          { statusCode: 404, count: 150, percentage: '15.00' },
          { statusCode: 500, count: 100, percentage: '10.00' }
        ],
        statusCategories: {
          success: 700,
          clientError: 200,
          serverError: 100
        },
        topStatusCodes: [],
        errorCodes: [],
        uniqueStatusCodes: 5
      };

      requestLogService.getStatusCodeStats.mockResolvedValue(Result.success(mockStats));

      await requestLogController.getStatusCodeStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
      expect(res.json.mock.calls[0][0].data.statusCodeDistribution).toHaveLength(3);
    });

    test('trata erro ao buscar status codes', async () => {
      requestLogService.getStatusCodeStats.mockResolvedValue(
        Result.failure({ message: 'Database error', code: 'DATABASE_ERROR' })
      );

      await requestLogController.getStatusCodeStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPopularEndpoints - ENDPOINT 4', () => {
    test('retorna endpoints populares com sucesso', async () => {
      const mockStats = {
        totalEndpoints: 25,
        totalRequests: 1000,
        topEndpoints: [
          {
            endpoint: '/api/games',
            totalRequests: 300,
            percentage: '30.00',
            methods: { GET: 200, POST: 100 },
            avgResponseTime: 245.5
          },
          {
            endpoint: '/api/players',
            totalRequests: 200,
            percentage: '20.00',
            methods: { GET: 150, PUT: 50 },
            avgResponseTime: 180.2
          }
        ],
        allEndpoints: [],
        topEndpointMethods: []
      };

      requestLogService.getPopularEndpoints.mockResolvedValue(Result.success(mockStats));

      await requestLogController.getPopularEndpoints(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
      expect(res.json.mock.calls[0][0].data.topEndpoints).toHaveLength(2);
    });

    test('trata erro ao buscar endpoints populares', async () => {
      requestLogService.getPopularEndpoints.mockResolvedValue(
        Result.failure({ message: 'Calculation error', code: 'CALCULATION_ERROR' })
      );

      await requestLogController.getPopularEndpoints(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Calculation error'
        })
      );
    });
  });

  describe('getAllRequestLogs', () => {
    test('retorna todos os logs com sucesso', async () => {
      const mockLogs = [
        { id: 1, endpointAccess: '/api/games', statusCode: 200 },
        { id: 2, endpointAccess: '/api/players', statusCode: 404 }
      ];

      requestLogService.getAllRequestLogs.mockResolvedValue(Result.success(mockLogs));

      await requestLogController.getAllRequestLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockLogs
      });
    });

    test('inclui count de logs na resposta', async () => {
      const mockLogs = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

      requestLogService.getAllRequestLogs.mockResolvedValue(Result.success(mockLogs));

      await requestLogController.getAllRequestLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 100
        })
      );
    });

    test('trata erro ao buscar logs', async () => {
      requestLogService.getAllRequestLogs.mockResolvedValue(
        Result.failure({ message: 'Database error', code: 'DATABASE_ERROR' })
      );

      await requestLogController.getAllRequestLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('clearAllLogs', () => {
    test('limpa logs com sucesso', async () => {
      requestLogService.clearAllLogs.mockResolvedValue(
        Result.success({ deletedCount: 150 })
      );

      await requestLogController.clearAllLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todos os logs foram removidos',
        deletedCount: 150
      });
    });

    test('retorna deletedCount correto', async () => {
      requestLogService.clearAllLogs.mockResolvedValue(
        Result.success({ deletedCount: 42 })
      );

      await requestLogController.clearAllLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedCount: 42
        })
      );
    });

    test('trata erro ao limpar logs', async () => {
      requestLogService.clearAllLogs.mockResolvedValue(
        Result.failure({ message: 'Delete failed', code: 'DATABASE_ERROR', details: 'Lock timeout' })
      );

      await requestLogController.clearAllLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Delete failed',
        code: 'DATABASE_ERROR',
        details: 'Lock timeout'
      });
    });
  });

  describe('Result Monad - fold pattern', () => {
    test('usa fold para pattern matching em success', async () => {
      const mockStats = { totalRequests: 100 };
      requestLogService.getRequestStats.mockResolvedValue(Result.success(mockStats));

      await requestLogController.getRequestStats(req, res);

      // Verifica que onSuccess foi executado
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test('usa fold para pattern matching em failure', async () => {
      const mockError = { message: 'Error', code: 'TEST_ERROR' };
      requestLogService.getRequestStats.mockResolvedValue(Result.failure(mockError));

      await requestLogController.getRequestStats(req, res);

      // Verifica que onFailure foi executado
      expect(res.json.mock.calls[0][0].success).toBe(false);
      expect(res.json.mock.calls[0][0].error).toBe('Error');
    });
  });

  describe('Tratamento de códigos de status HTTP', () => {
    test('retorna 500 para DATABASE_ERROR', async () => {
      requestLogService.getRequestStats.mockResolvedValue(
        Result.failure({ message: 'DB error', code: 'DATABASE_ERROR' })
      );

      await requestLogController.getRequestStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('retorna 400 para outros erros', async () => {
      requestLogService.getRequestStats.mockResolvedValue(
        Result.failure({ message: 'Validation error', code: 'VALIDATION_ERROR' })
      );

      await requestLogController.getRequestStats(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('retorna 200 para sucesso', async () => {
      requestLogService.getRequestStats.mockResolvedValue(
        Result.success({ totalRequests: 0 })
      );

      await requestLogController.getRequestStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Formato de resposta consistente', () => {
    test('resposta de sucesso tem formato consistente', async () => {
      requestLogService.getRequestStats.mockResolvedValue(
        Result.success({ totalRequests: 100 })
      );

      await requestLogController.getRequestStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    test('resposta de erro tem formato consistente', async () => {
      requestLogService.getRequestStats.mockResolvedValue(
        Result.failure({ message: 'Error', code: 'TEST_ERROR' })
      );

      await requestLogController.getRequestStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          code: expect.any(String)
        })
      );
    });
  });
});
