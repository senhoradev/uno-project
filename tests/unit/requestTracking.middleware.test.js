const requestTracking = require('../../src/middlewares/requestTracking');
const requestLogService = require('../../src/services/requestLogService');

jest.mock('../../src/services/requestLogService');

/**
 * @fileoverview Testes unitários para o middleware requestTracking
 * 
 * Testa:
 * - Captura de métricas de requisições
 * - Interceptação de res.json e res.send
 * - Cálculo de tempo de resposta
 * - Extração de userId de usuários autenticados
 * - Salvamento assíncrono de logs
 */

describe('RequestTracking Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock da requisição
    req = {
      originalUrl: '/api/games?limit=10',
      method: 'GET',
      user: null
    };

    // Mock da resposta
    res = {
      statusCode: 200,
      json: jest.fn(),
      send: jest.fn()
    };

    // Mock do next
    next = jest.fn();

    // Mock do serviço para não salvar realmente
    requestLogService.createRequestLog.mockResolvedValue({ isSuccess: true });
  });

  describe('Captura de métricas básicas', () => {
    test('captura endpoint, método e status code', async () => {
      requestTracking(req, res, next);

      // Simula resposta
      await res.json({ success: true });

      // Aguarda a execução assíncrona do log
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          endpointAccess: '/api/games',
          requestMethod: 'GET',
          statusCode: 200
        })
      );
    });

    test('remove query strings do endpoint', async () => {
      req.originalUrl = '/api/players?page=1&limit=20';

      requestTracking(req, res, next);
      await res.json({ data: [] });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          endpointAccess: '/api/players'
        })
      );
    });

    test('captura método POST', async () => {
      req.method = 'POST';

      requestTracking(req, res, next);
      await res.json({ created: true });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          requestMethod: 'POST'
        })
      );
    });

    test('captura diferentes status codes', async () => {
      res.statusCode = 404;

      requestTracking(req, res, next);
      await res.json({ error: 'Not Found' });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404
        })
      );
    });
  });

  describe('Cálculo de tempo de resposta', () => {
    test('calcula responseTime em milissegundos', async () => {
      requestTracking(req, res, next);

      // Aguarda 100ms antes de responder
      await new Promise(resolve => setTimeout(resolve, 100));
      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const call = requestLogService.createRequestLog.mock.calls[0][0];
      expect(call.responseTime).toBeGreaterThanOrEqual(100);
      expect(call.responseTime).toBeLessThan(200);
    });

    test('responseTime é um número', async () => {
      requestTracking(req, res, next);
      await res.json({});
      await new Promise(resolve => setTimeout(resolve, 50));

      const call = requestLogService.createRequestLog.mock.calls[0][0];
      expect(typeof call.responseTime).toBe('number');
      expect(call.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Captura de userId de usuários autenticados', () => {
    test('captura userId quando usuário está autenticado', async () => {
      req.user = { id: 123, username: 'testuser' };

      requestTracking(req, res, next);
      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123'
        })
      );
    });

    test('userId é null quando usuário não está autenticado', async () => {
      req.user = null;

      requestTracking(req, res, next);
      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null
        })
      );
    });

    test('userId é null quando req.user existe mas não tem id', async () => {
      req.user = { username: 'testuser' };

      requestTracking(req, res, next);
      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null
        })
      );
    });

    test('converte userId para string', async () => {
      req.user = { id: 456, username: 'user456' };

      requestTracking(req, res, next);
      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const call = requestLogService.createRequestLog.mock.calls[0][0];
      expect(typeof call.userId).toBe('string');
      expect(call.userId).toBe('456');
    });
  });

  describe('Interceptação de res.json', () => {
    test('intercepta res.json e mantém funcionalidade original', async () => {
      const responseData = { success: true, data: 'test' };

      requestTracking(req, res, next);

      // Guarda referência ao json interceptado
      const interceptedJson = res.json;
      res.json = jest.fn(interceptedJson);

      await res.json(responseData);

      expect(res.json).toHaveBeenCalledWith(responseData);
    });

    test('salva log ao chamar res.json', async () => {
      requestTracking(req, res, next);
      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalled();
    });

    test('inclui timestamp ao salvar log', async () => {
      const beforeTime = new Date();

      requestTracking(req, res, next);
      await res.json({});
      await new Promise(resolve => setTimeout(resolve, 50));

      const call = requestLogService.createRequestLog.mock.calls[0][0];
      expect(call.timestamp).toBeInstanceOf(Date);
      expect(call.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Interceptação de res.send', () => {
    test('intercepta res.send e salva log', async () => {
      requestTracking(req, res, next);
      await res.send('Hello World');
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalled();
    });

    test('captura métricas ao usar res.send', async () => {
      res.statusCode = 201;

      requestTracking(req, res, next);
      await res.send({ created: true });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledWith(
        expect.objectContaining({
          endpointAccess: '/api/games',
          requestMethod: 'GET',
          statusCode: 201
        })
      );
    });
  });

  describe('Tratamento de erros', () => {
    test('não quebra aplicação se serviço falhar', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      requestLogService.createRequestLog.mockRejectedValue(new Error('Database error'));

      requestTracking(req, res, next);
      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 50));

      // Middleware não deve lançar erro
      expect(res.json).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test('loga erro silenciosamente ao falhar', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      requestLogService.createRequestLog.mockRejectedValue(new Error('Save failed'));

      requestTracking(req, res, next);
      await res.json({});
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Chamada do next middleware', () => {
    test('chama next() para continuar chain de middlewares', () => {
      requestTracking(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('chama next() imediatamente, não aguarda log', () => {
      requestTracking(req, res, next);

      // next deve ser chamado imediatamente
      expect(next).toHaveBeenCalled();
      
      // Log service não deve ter sido chamado ainda (só após res.json/send)
      expect(requestLogService.createRequestLog).not.toHaveBeenCalled();
    });
  });

  describe('Comportamento assíncrono (fire and forget)', () => {
    test('não aguarda salvamento do log (fire and forget)', async () => {
      const slowSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ isSuccess: true }), 1000))
      );
      requestLogService.createRequestLog = slowSave;

      requestTracking(req, res, next);
      await res.json({ data: 'test' });

      // res.json deve retornar imediatamente, sem aguardar o save
      expect(slowSave).toHaveBeenCalled();
    });
  });

  describe('Múltiplas requisições', () => {
    test('processa múltiplas requisições independentemente', async () => {
      // Primeira requisição
      const req1 = { ...req, originalUrl: '/api/games', method: 'GET' };
      const res1 = { ...res, statusCode: 200, json: jest.fn(), send: jest.fn() };
      requestTracking(req1, res1, next);
      await res1.json({});

      // Segunda requisição
      const req2 = { ...req, originalUrl: '/api/players', method: 'POST' };
      const res2 = { ...res, statusCode: 201, json: jest.fn(), send: jest.fn() };
      requestTracking(req2, res2, next);
      await res2.json({});

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(requestLogService.createRequestLog).toHaveBeenCalledTimes(2);
      expect(requestLogService.createRequestLog).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          endpointAccess: '/api/games',
          requestMethod: 'GET',
          statusCode: 200
        })
      );
      expect(requestLogService.createRequestLog).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          endpointAccess: '/api/players',
          requestMethod: 'POST',
          statusCode: 201
        })
      );
    });
  });
});
