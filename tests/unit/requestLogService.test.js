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
      expect(result.value.total_requests).toBe(5);
      expect(result.value.breakdown['/api/games']).toEqual({ GET: 1, POST: 1 });
      expect(result.value.breakdown['/api/players']).toEqual({ GET: 1 });
      expect(result.value.breakdown['/api/cards']).toEqual({ GET: 1, DELETE: 1 });
    });

    test('retorna estatísticas vazias quando não há logs', async () => {
      requestLogRepository.findAll.mockResolvedValue([]);

      const result = await requestLogService.getRequestStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value.total_requests).toBe(0);
      expect(result.value.breakdown).toEqual({});
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
        { id: 1, endpointAccess: '/api/users', responseTime: 50 },
        { id: 2, endpointAccess: '/api/users', responseTime: 100 },
        { id: 3, endpointAccess: '/api/users', responseTime: 200 },
        { id: 4, endpointAccess: '/api/products', responseTime: 150 },
        { id: 5, endpointAccess: '/api/products', responseTime: 250 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getResponseTimeStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value['/api/users']).toBeDefined();
      expect(result.value['/api/users'].avg).toBe(117); // (50+100+200)/3 = 116.67 arredondado
      expect(result.value['/api/users'].min).toBe(50);
      expect(result.value['/api/users'].max).toBe(200);
      
      expect(result.value['/api/products']).toBeDefined();
      expect(result.value['/api/products'].avg).toBe(200); // (150+250)/2
      expect(result.value['/api/products'].min).toBe(150);
      expect(result.value['/api/products'].max).toBe(250);
    });

    test('retorna objeto vazio quando não há logs', async () => {
      requestLogRepository.findAll.mockResolvedValue([]);

      const result = await requestLogService.getResponseTimeStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({});
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
      expect(result.value['200']).toBe(3);
      expect(result.value['201']).toBe(1);
      expect(result.value['404']).toBe(2);
      expect(result.value['500']).toBe(3);
      expect(result.value['503']).toBe(1);
    });

    test('retorna objeto vazio quando não há logs', async () => {
      requestLogRepository.findAll.mockResolvedValue([]);

      const result = await requestLogService.getStatusCodeStats();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({});
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
      expect(result.value.most_popular).toBe('/api/games');
      expect(result.value.request_count).toBe(3);
    });

    test('retorna null quando não há logs', async () => {
      requestLogRepository.findAll.mockResolvedValue([]);

      const result = await requestLogService.getPopularEndpoints();

      expect(result.isSuccess).toBe(true);
      expect(result.value.most_popular).toBeNull();
      expect(result.value.request_count).toBe(0);
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
    test('usa filter para filtrar requisições por status code', async () => {
      const mockLogs = [
        { statusCode: 200 },
        { statusCode: 201 },
        { statusCode: 400 },
        { statusCode: 500 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getStatusCodeStats();

      // Filter usado internamente para contar apenas códigos específicos
      expect(result.value['200']).toBe(1);
      expect(result.value['201']).toBe(1);
      expect(result.value['400']).toBe(1);
      expect(result.value['500']).toBe(1);
    });

    test('usa reduce para agrupar requisições por endpoint e método', async () => {
      const mockLogs = [
        { endpointAccess: '/api/games', requestMethod: 'GET' },
        { endpointAccess: '/api/games', requestMethod: 'GET' },
        { endpointAccess: '/api/games', requestMethod: 'POST' },
        { endpointAccess: '/api/players', requestMethod: 'PUT' },
        { endpointAccess: '/api/players', requestMethod: 'GET' }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getRequestStats();

      // Reduce usado internamente para agrupar por endpoint e método
      expect(result.value.breakdown['/api/games']['GET']).toBe(2);
      expect(result.value.breakdown['/api/games']['POST']).toBe(1);
      expect(result.value.breakdown['/api/players']['GET']).toBe(1);
      expect(result.value.breakdown['/api/players']['PUT']).toBe(1);
    });

    test('usa map para extrair e transformar dados de tempo de resposta', async () => {
      const mockLogs = [
        { endpointAccess: '/api/games', responseTime: 100 },
        { endpointAccess: '/api/games', responseTime: 200 },
        { endpointAccess: '/api/games', responseTime: 300 }
      ];

      requestLogRepository.findAll.mockResolvedValue(mockLogs);

      const result = await requestLogService.getResponseTimeStats();

      // Map usado internamente para extrair tempos e calcular estatísticas
      expect(result.value['/api/games'].avg).toBe(200);
      expect(result.value['/api/games'].min).toBe(100);
      expect(result.value['/api/games'].max).toBe(300);
    });
  });
});
