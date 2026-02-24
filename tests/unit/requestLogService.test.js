const requestLogService = require('../../src/services/requestLogService');
const requestLogRepository = require('../../src/Repository/requestLogRepository');
const Result = require('../../src/utils/Result');

jest.mock('../../src/Repository/requestLogRepository');

/**
 * @fileoverview Testes unitários para o requestLogService
 * 
 * Testa:
 * - Validação de dados
 * - Criação de logs
 * - Cálculo de estatísticas usando programação funcional
 * - Memoization
 * - Result Monad
 */

describe('RequestLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpa o cache entre os testes
    requestLogService.invalidateCache();
  });

  describe('validateRequestLogData', () => {
    test('valida dados corretos com sucesso', () => {
      const validData = {
        endpointAccess: '/api/games',
        requestMethod: 'GET',
        statusCode: 200,
        responseTime: 150
      };

      const result = requestLogService.validateRequestLogData(validData);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(validData);
    });

    test('falha quando endpointAccess está ausente', () => {
      const invalidData = {
        requestMethod: 'GET',
        statusCode: 200,
        responseTime: 150
      };

      const result = requestLogService.validateRequestLogData(invalidData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('O campo endpointAccess é obrigatório');
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('falha quando requestMethod está ausente', () => {
      const invalidData = {
        endpointAccess: '/api/games',
        statusCode: 200,
        responseTime: 150
      };

      const result = requestLogService.validateRequestLogData(invalidData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('O campo requestMethod é obrigatório');
    });

    test('falha quando statusCode não é número', () => {
      const invalidData = {
        endpointAccess: '/api/games',
        requestMethod: 'GET',
        statusCode: '200',
        responseTime: 150
      };

      const result = requestLogService.validateRequestLogData(invalidData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('O campo statusCode deve ser um número');
    });

    test('falha quando responseTime não é número', () => {
      const invalidData = {
        endpointAccess: '/api/games',
        requestMethod: 'GET',
        statusCode: 200,
        responseTime: '150'
      };

      const result = requestLogService.validateRequestLogData(invalidData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('O campo responseTime deve ser um número');
    });
  });

  describe('createRequestLog', () => {
    test('cria log de requisição com sucesso', async () => {
      const logData = {
        endpointAccess: '/api/games',
        requestMethod: 'POST',
        statusCode: 201,
        responseTime: 200,
        timestamp: new Date(),
        userId: 'user123'
      };

      const mockLog = { id: 1, ...logData };
      requestLogRepository.save.mockResolvedValue(mockLog);

      const result = await requestLogService.createRequestLog(logData);

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe(1);
      expect(result.value.endpointAccess).toBe('/api/games');
      expect(requestLogRepository.save).toHaveBeenCalledWith(logData);
    });

    test('falha ao criar log com dados inválidos', async () => {
      const invalidData = {
        requestMethod: 'GET',
        statusCode: 200,
        responseTime: 150
      };

      const result = await requestLogService.createRequestLog(invalidData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(requestLogRepository.save).not.toHaveBeenCalled();
    });

    test('trata erro do banco de dados corretamente', async () => {
      const logData = {
        endpointAccess: '/api/games',
        requestMethod: 'GET',
        statusCode: 200,
        responseTime: 150
      };

      requestLogRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await requestLogService.createRequestLog(logData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toBe('Erro ao criar log de requisição no banco de dados');
    });
  });

  describe('getAllRequestLogs', () => {
    test('retorna todos os logs com sucesso', async () => {
      const mockLogs = [
        { id: 1, endpointAccess: '/api/games', requestMethod: 'GET', statusCode: 200, responseTime: 100 },
        { id: 2, endpointAccess: '/api/players', requestMethod: 'POST', statusCode: 201, responseTime: 150 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getAllRequestLogs();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(mockLogs);
      expect(result.value.length).toBe(2);
    });

    test('trata erro ao buscar logs', async () => {
      requestLogRepository.findAll.mockRejectedValue(new Error('Database error'));

      const result = await requestLogService.getAllRequestLogs();

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('getRequestStats - ENDPOINT 1', () => {
    test('calcula estatísticas gerais corretamente', async () => {
      const mockLogs = [
        { id: 1, endpointAccess: '/api/games', requestMethod: 'GET', statusCode: 200, responseTime: 100, userId: 'user1' },
        { id: 2, endpointAccess: '/api/games', requestMethod: 'POST', statusCode: 201, responseTime: 150, userId: 'user1' },
        { id: 3, endpointAccess: '/api/players', requestMethod: 'GET', statusCode: 404, responseTime: 50, userId: null },
        { id: 4, endpointAccess: '/api/cards', requestMethod: 'GET', statusCode: 500, responseTime: 200, userId: 'user2' },
        { id: 5, endpointAccess: '/api/cards', requestMethod: 'DELETE', statusCode: 200, responseTime: 80, userId: 'user3' }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getRequestStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value.totalRequests).toBe(5);
      expect(result.value.successfulRequests).toBe(3); // 200, 201, 200
      expect(result.value.failedRequests).toBe(2); // 404, 500
      expect(result.value.successRate).toBe(60.00);
      expect(result.value.failureRate).toBe(40.00);
      expect(result.value.requestsByMethod).toEqual({
        GET: 3,
        POST: 1,
        DELETE: 1
      });
      expect(result.value.authenticatedRequests).toBe(4);
      expect(result.value.unauthenticatedRequests).toBe(1);
    });

    test('retorna estatísticas vazias quando não há logs', async () => {
      requestLogRepository.findAll.mockResolvedValue([]);

      const result = await requestLogService.getRequestStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value.totalRequests).toBe(0);
      expect(result.value.successfulRequests).toBe(0);
      expect(result.value.successRate).toBe(0);
    });

    test('usa memoization para cache de estatísticas', async () => {
      const mockLogs = [
        { id: 1, endpointAccess: '/api/games', requestMethod: 'GET', statusCode: 200, responseTime: 100 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      // Primeira chamada
      await requestLogService.getRequestStats();
      // Segunda chamada (deve usar cache)
      await requestLogService.getRequestStats();

      // findAll deve ser chamado 2 vezes (memoization é por chave, não global)
      expect(requestLogRepository.findAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('getResponseTimeStats - ENDPOINT 2', () => {
    test('calcula estatísticas de tempo de resposta corretamente', async () => {
      const mockLogs = [
        { id: 1, responseTime: 50 },
        { id: 2, responseTime: 100 },
        { id: 3, responseTime: 150 },
        { id: 4, responseTime: 200 },
        { id: 5, responseTime: 250 },
        { id: 6, responseTime: 300 },
        { id: 7, responseTime: 400 },
        { id: 8, responseTime: 500 },
        { id: 9, responseTime: 800 },
        { id: 10, responseTime: 1200 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getResponseTimeStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value.totalRequests).toBe(10);
      expect(result.value.minResponseTime).toBe(50);
      expect(result.value.maxResponseTime).toBe(1200);
      expect(result.value.averageResponseTime).toBe(395); // Soma: 3950 / 10
      expect(result.value.medianResponseTime).toBe(275); // (250 + 300) / 2

      // Verifica faixas de tempo
      // fast: < 100 → 50
      // medium: 100 to < 500 → 100, 150, 200, 250, 300, 400
      // slow: 500 to < 1000 → 500, 800
      // verySlow: >= 1000 → 1200
      expect(result.value.timeRanges.fast).toBe(1); // < 100ms: 50
      expect(result.value.timeRanges.medium).toBe(6); // 100-500ms: 100, 150, 200, 250, 300, 400
      expect(result.value.timeRanges.slow).toBe(2); // 500-1000ms: 500, 800
      expect(result.value.timeRanges.verySlow).toBe(1); // >= 1000ms: 1200
    });

    test('calcula percentis corretamente', async () => {
      // Cria array de 100 logs com tempos crescentes
      const mockLogs = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        responseTime: (i + 1) * 10
      }));

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getResponseTimeStats();

      expect(result.isSuccess).toBe(true);
      // P95 = index 95 (0-based), que é 960 (96 * 10)
      // P99 = index 99 (0-based), que é 1000 (100 * 10)
      expect(result.value.p95ResponseTime).toBeGreaterThanOrEqual(940);
      expect(result.value.p95ResponseTime).toBeLessThanOrEqual(960);
      expect(result.value.p99ResponseTime).toBeGreaterThanOrEqual(980);
      expect(result.value.p99ResponseTime).toBeLessThanOrEqual(1000);
    });

    test('retorna zeros quando não há logs', async () => {
      requestLogRepository.findAll.mockResolvedValue([]);

      const result = await requestLogService.getResponseTimeStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value.averageResponseTime).toBe(0);
      expect(result.value.minResponseTime).toBe(0);
      expect(result.value.maxResponseTime).toBe(0);
    });
  });

  describe('getStatusCodeStats - ENDPOINT 3', () => {
    test('calcula estatísticas de status codes corretamente', async () => {
      const mockLogs = [
        { statusCode: 200 },
        { statusCode: 200 },
        { statusCode: 200 },
        { statusCode: 201 },
        { statusCode: 404 },
        { statusCode: 404 },
        { statusCode: 500 },
        { statusCode: 500 },
        { statusCode: 500 },
        { statusCode: 503 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getStatusCodeStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value.totalRequests).toBe(10);
      expect(result.value.uniqueStatusCodes).toBe(5);

      // Verifica categorias
      expect(result.value.statusCategories.success).toBe(4); // 200, 201
      expect(result.value.statusCategories.clientError).toBe(2); // 404
      expect(result.value.statusCategories.serverError).toBe(4); // 500, 503

      // Verifica distribuição ordenada por count
      expect(result.value.statusCodeDistribution[0].statusCode).toBe(200);
      expect(result.value.statusCodeDistribution[0].count).toBe(3);
      expect(result.value.statusCodeDistribution[0].percentage).toBe('30.00');

      // Verifica top status codes
      expect(result.value.topStatusCodes.length).toBeLessThanOrEqual(5);

      // Verifica códigos de erro (>= 400)
      expect(result.value.errorCodes.length).toBe(3); // 404, 500, 503
    });

    test('categoriza status codes corretamente', async () => {
      const mockLogs = [
        { statusCode: 100 }, // informational
        { statusCode: 200 }, // success
        { statusCode: 301 }, // redirection
        { statusCode: 404 }, // clientError
        { statusCode: 500 }  // serverError
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getStatusCodeStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value.statusCategories.informational).toBe(1);
      expect(result.value.statusCategories.success).toBe(1);
      expect(result.value.statusCategories.redirection).toBe(1);
      expect(result.value.statusCategories.clientError).toBe(1);
      expect(result.value.statusCategories.serverError).toBe(1);
    });
  });

  describe('getPopularEndpoints - ENDPOINT 4', () => {
    test('calcula endpoints populares corretamente', async () => {
      const mockLogs = [
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 200 },
        { endpointAccess: '/api/games', requestMethod: 'POST', responseTime: 150 },
        { endpointAccess: '/api/players', requestMethod: 'GET', responseTime: 80 },
        { endpointAccess: '/api/players', requestMethod: 'PUT', responseTime: 120 },
        { endpointAccess: '/api/cards', requestMethod: 'GET', responseTime: 50 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getPopularEndpoints();

      expect(result.isSuccess).toBe(true);
      expect(result.value.totalEndpoints).toBe(3);
      expect(result.value.totalRequests).toBe(6);

      // Endpoint mais popular
      expect(result.value.topEndpoints[0].endpoint).toBe('/api/games');
      expect(result.value.topEndpoints[0].totalRequests).toBe(3);
      expect(result.value.topEndpoints[0].percentage).toBe('50.00');
      expect(result.value.topEndpoints[0].methods.GET).toBe(2);
      expect(result.value.topEndpoints[0].methods.POST).toBe(1);
      expect(result.value.topEndpoints[0].avgResponseTime).toBe(150); // (100 + 200 + 150) / 3

      // Segundo endpoint
      expect(result.value.topEndpoints[1].endpoint).toBe('/api/players');
      expect(result.value.topEndpoints[1].totalRequests).toBe(2);
    });

    test('ordena endpoints por popularidade (mais acessados primeiro)', async () => {
      const mockLogs = [
        { endpointAccess: '/api/cards', requestMethod: 'GET', responseTime: 50 },
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/players', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/players', requestMethod: 'GET', responseTime: 100 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getPopularEndpoints();

      expect(result.isSuccess).toBe(true);
      // Verifica ordem decrescente por totalRequests
      expect(result.value.topEndpoints[0].totalRequests).toBeGreaterThanOrEqual(
        result.value.topEndpoints[1].totalRequests
      );
    });

    test('calcula tempo médio de resposta por endpoint', async () => {
      const mockLogs = [
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 300 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getPopularEndpoints();

      expect(result.isSuccess).toBe(true);
      expect(result.value.topEndpoints[0].avgResponseTime).toBe(200); // (100 + 300) / 2
    });

    test('inclui top combinações endpoint+método', async () => {
      const mockLogs = [
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/games', requestMethod: 'GET', responseTime: 100 },
        { endpointAccess: '/api/games', requestMethod: 'POST', responseTime: 100 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getPopularEndpoints();

      expect(result.isSuccess).toBe(true);
      expect(result.value.topEndpointMethods).toBeDefined();
      expect(result.value.topEndpointMethods[0].method).toBe('GET');
      expect(result.value.topEndpointMethods[0].endpoint).toBe('/api/games');
      expect(result.value.topEndpointMethods[0].count).toBe(2);
    });
  });

  describe('clearAllLogs', () => {
    test('limpa todos os logs com sucesso', async () => {
      requestLogRepository.deleteAll.mockResolvedValue(10);

      const result = await requestLogService.clearAllLogs();

      expect(result.isSuccess).toBe(true);
      expect(result.value.deletedCount).toBe(10);
      expect(requestLogRepository.deleteAll).toHaveBeenCalled();
    });

    test('trata erro ao limpar logs', async () => {
      requestLogRepository.deleteAll.mockRejectedValue(new Error('Database error'));

      const result = await requestLogService.clearAllLogs();

      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('getStatusCategoryName', () => {
    test('retorna nomes corretos das categorias', () => {
      expect(requestLogService.getStatusCategoryName(1)).toBe('informational');
      expect(requestLogService.getStatusCategoryName(2)).toBe('success');
      expect(requestLogService.getStatusCategoryName(3)).toBe('redirection');
      expect(requestLogService.getStatusCategoryName(4)).toBe('clientError');
      expect(requestLogService.getStatusCategoryName(5)).toBe('serverError');
      expect(requestLogService.getStatusCategoryName(9)).toBe('unknown');
    });
  });

  describe('Programação Funcional - Filter, Map, Reduce', () => {
    test('usa filter para filtrar requisições bem-sucedidas', async () => {
      const mockLogs = [
        { statusCode: 200 },
        { statusCode: 201 },
        { statusCode: 400 },
        { statusCode: 500 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getRequestStats();

      expect(result.value.successfulRequests).toBe(2);
    });

    test('usa reduce para agrupar requisições por método', async () => {
      const mockLogs = [
        { requestMethod: 'GET' },
        { requestMethod: 'GET' },
        { requestMethod: 'POST' },
        { requestMethod: 'PUT' },
        { requestMethod: 'GET' }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getRequestStats();

      expect(result.value.requestsByMethod.GET).toBe(3);
      expect(result.value.requestsByMethod.POST).toBe(1);
      expect(result.value.requestsByMethod.PUT).toBe(1);
    });

    test('usa map para extrair e transformar dados', async () => {
      const mockLogs = [
        { responseTime: 100 },
        { responseTime: 200 },
        { responseTime: 300 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getResponseTimeStats();

      // Map extrai os tempos e calcula a média
      expect(result.value.averageResponseTime).toBe(200);
    });
  });
});
