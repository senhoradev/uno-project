const requestLogRepository = require('../Repository/requestLogRepository');
const Result = require('../utils/Result');

/**
 * @fileoverview Serviço de logs de requisições implementado com Result Monad e Programação Funcional
 * 
 * Implementa:
 * - Result Monad para tratamento de erros
 * - Functors (map, filter) para transformação de dados
 * - Accumulators (reduce) para agregação
 * - Memoization para otimização
 * - Pipes para composição de funções
 * - Princípios SOLID (Single Responsibility, Open/Closed)
 * 
 * @module services/requestLogService
 */

/**
 * Cache para memoization de estatísticas
 * Evita recálculos desnecessários quando os dados não mudaram
 */
const statsCache = new Map();
let lastCacheTime = null;
const CACHE_TTL = 60000; // 1 minuto

/**
 * Serviço para gerenciar logs de requisições e calcular estatísticas
 * Utiliza técnicas de programação funcional para processamento de dados
 * @class RequestLogService
 */
class RequestLogService {
  /**
   * Valida dados de log de requisição
   * @param {Object} data - Dados do log
   * @returns {Result} Result.success(data) ou Result.failure(error)
   */
  validateRequestLogData(data) {
    if (!data.endpointAccess) {
      return Result.failure({
        message: 'O campo endpointAccess é obrigatório',
        field: 'endpointAccess',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!data.requestMethod) {
      return Result.failure({
        message: 'O campo requestMethod é obrigatório',
        field: 'requestMethod',
        code: 'VALIDATION_ERROR'
      });
    }

    if (typeof data.statusCode !== 'number') {
      return Result.failure({
        message: 'O campo statusCode deve ser um número',
        field: 'statusCode',
        code: 'VALIDATION_ERROR'
      });
    }

    if (typeof data.responseTime !== 'number') {
      return Result.failure({
        message: 'O campo responseTime deve ser um número',
        field: 'responseTime',
        code: 'VALIDATION_ERROR'
      });
    }

    return Result.success(data);
  }

  /**
   * Cria um novo log de requisição
   * @param {Object} data - Dados do log
   * @returns {Promise<Result>} Result.success(log) ou Result.failure(error)
   */
  async createRequestLog(data) {
    const validationResult = this.validateRequestLogData(data);

    if (!validationResult.isSuccess) {
      return validationResult;
    }

    try {
      const log = await requestLogRepository.save(data);
      
      // Invalida cache ao criar novo log
      this.invalidateCache();
      
      return Result.success(log).map(l => ({
        id: l.id,
        endpointAccess: l.endpointAccess,
        requestMethod: l.requestMethod,
        statusCode: l.statusCode,
        responseTime: l.responseTime,
        timestamp: l.timestamp,
        userId: l.userId
      }));
    } catch (error) {
      return Result.failure({
        message: 'Erro ao criar log de requisição no banco de dados',
        details: error.message,
        code: 'DATABASE_ERROR'
      });
    }
  }

  /**
   * Invalida o cache de estatísticas
   * @private
   */
  invalidateCache() {
    statsCache.clear();
    lastCacheTime = null;
  }

  /**
   * Verifica se o cache ainda é válido
   * @private
   * @returns {boolean}
   */
  isCacheValid() {
    if (!lastCacheTime) return false;
    return (Date.now() - lastCacheTime) < CACHE_TTL;
  }

  /**
   * Obtém valor do cache ou executa função e armazena resultado (Memoization)
   * @private
   * @param {string} key - Chave do cache
   * @param {Function} fn - Função a executar se não houver cache
   * @returns {*} Valor do cache ou resultado da função
   */
  memoize(key, fn) {
    if (this.isCacheValid() && statsCache.has(key)) {
      return statsCache.get(key);
    }

    const result = fn();
    statsCache.set(key, result);
    lastCacheTime = Date.now();
    return result;
  }

  /**
   * Busca todos os logs de requisições
   * IMPORTANTE: Retorna lista completa para processamento na camada de serviço
   * Não usa agregações do ORM conforme requisito da atividade
   * 
   * @returns {Promise<Result>} Result com array de logs
   */
  async getAllRequestLogs() {
    try {
      const logs = await requestLogRepository.findAll();
      return Result.success(logs);
    } catch (error) {
      return Result.failure({
        message: 'Erro ao buscar logs de requisições',
        details: error.message,
        code: 'DATABASE_ERROR'
      });
    }
  }

  /**
   * ENDPOINT 1: /stats/requests
   * Retorna estatísticas gerais das requisições
   * Formato do enunciado:
   * {
   *   "total_requests": 150,
   *   "breakdown": {
   *     "/api/users": { "GET": 50, "POST": 30 },
   *     "/api/products": { "GET": 40, "DELETE": 10 }
   *   }
   * }
   * 
   * Usa:
   * - Reduce: para agrupar por endpoint e método (accumulator)
   * - Filter: para filtrar dados
   * - Map: para transformar dados
   * 
   * @returns {Promise<Result>} Estatísticas de requisições
   */
  async getRequestStats() {
    try {
      const logsResult = await this.getAllRequestLogs();
      
      if (!logsResult.isSuccess) {
        return logsResult;
      }

      const logs = logsResult.value;

      // Usa memoization para otimizar cálculos repetidos
      const stats = this.memoize('requestStats', () => {
        // ACCUMULATOR - Conta total de requisições
        const total_requests = logs.length;

        // REDUCE (ACCUMULATOR) - Agrupa por endpoint e método
        // Formato: { "/api/users": { "GET": 50, "POST": 30 } }
        const breakdown = logs.reduce((acc, log) => {
          const endpoint = log.endpointAccess;
          const method = log.requestMethod;
          
          // Inicializa endpoint se não existir
          if (!acc[endpoint]) {
            acc[endpoint] = {};
          }
          
          // Conta requisições por método dentro do endpoint
          acc[endpoint][method] = (acc[endpoint][method] || 0) + 1;
          
          return acc;
        }, {});

        return {
          total_requests,
          breakdown
        };
      });

      return Result.success(stats);
    } catch (error) {
      return Result.failure({
        message: 'Erro ao calcular estatísticas de requisições',
        details: error.message,
        code: 'CALCULATION_ERROR'
      });
    }
  }

  /**
   * ENDPOINT 2: /stats/response-times
   * Retorna estatísticas de tempos de resposta por endpoint
   * Formato do enunciado:
   * {
   *   "/api/users": { "avg": 120, "min": 50, "max": 300 },
   *   "/api/products": { "avg": 200, "min": 100, "max": 500 }
   * }
   * 
   * Usa:
   * - Reduce: para agrupar por endpoint (accumulator)
   * - Map: para extrair tempos e calcular estatísticas
   * - Filter: para filtrar dados válidos
   * 
   * @returns {Promise<Result>} Estatísticas de tempo de resposta
   */
  async getResponseTimeStats() {
    try {
      const logsResult = await this.getAllRequestLogs();
      
      if (!logsResult.isSuccess) {
        return logsResult;
      }

      const logs = logsResult.value;

      // Usa memoization
      const stats = this.memoize('responseTimeStats', () => {
        if (logs.length === 0) {
          return {};
        }

        // REDUCE (ACCUMULATOR) - Agrupa logs por endpoint
        const endpointGroups = logs.reduce((acc, log) => {
          const endpoint = log.endpointAccess;
          if (!acc[endpoint]) {
            acc[endpoint] = [];
          }
          acc[endpoint].push(log.responseTime);
          return acc;
        }, {});

        // MAP + REDUCE - Calcula estatísticas para cada endpoint
        const result = {};
        Object.keys(endpointGroups).forEach(endpoint => {
          const times = endpointGroups[endpoint];
          
          // REDUCE - Calcula soma para média
          const sum = times.reduce((acc, time) => acc + time, 0);
          const avg = Math.round(sum / times.length);
          
          // Calcula min e max
          const min = Math.min(...times);
          const max = Math.max(...times);
          
          result[endpoint] = { avg, min, max };
        });

        return result;
      });

      return Result.success(stats);
    } catch (error) {
      return Result.failure({
        message: 'Erro ao calcular estatísticas de tempo de resposta',
        details: error.message,
        code: 'CALCULATION_ERROR'
      });
    }
  }

  /**
   * ENDPOINT 3: /stats/status-codes
   * Retorna estatísticas de códigos de status HTTP
   * Formato do enunciado:
   * {
   *   "200": 130,
   *   "404": 10,
   *   "500": 10
   * }
   * 
   * Usa:
   * - Reduce: para agrupar por status code (accumulator)
   * 
   * @returns {Promise<Result>} Estatísticas de status codes
   */
  async getStatusCodeStats() {
    try {
      const logsResult = await this.getAllRequestLogs();
      
      if (!logsResult.isSuccess) {
        return logsResult;
      }

      const logs = logsResult.value;

      // Usa memoization
      const stats = this.memoize('statusCodeStats', () => {
        // REDUCE (ACCUMULATOR) - Agrupa por código de status
        // Retorna objeto simples: { "200": 130, "404": 10, "500": 10 }
        const statusCodeCounts = logs.reduce((acc, log) => {
          const code = String(log.statusCode);
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        }, {});

        return statusCodeCounts;
      });

      return Result.success(stats);
    } catch (error) {
      return Result.failure({
        message: 'Erro ao calcular estatísticas de status codes',
        details: error.message,
        code: 'CALCULATION_ERROR'
      });
    }
  }

  /**
   * ENDPOINT 4: /stats/popular-endpoints
   * Retorna endpoints mais acessados
   * Formato do enunciado:
   * {
   *   "most_popular": "/api/users",
   *   "request_count": 80
   * }
   * 
   * Usa:
   * - Reduce: para contar acessos por endpoint (accumulator)
   * - Sort: para ordenar por popularidade
   * 
   * @returns {Promise<Result>} Endpoints mais populares
   */
  async getPopularEndpoints() {
    try {
      const logsResult = await this.getAllRequestLogs();
      
      if (!logsResult.isSuccess) {
        return logsResult;
      }

      const logs = logsResult.value;

      // Usa memoization
      const stats = this.memoize('popularEndpoints', () => {
        if (logs.length === 0) {
          return {
            most_popular: null,
            request_count: 0
          };
        }

        // REDUCE (ACCUMULATOR) - Conta acessos por endpoint
        const endpointCounts = logs.reduce((acc, log) => {
          const endpoint = log.endpointAccess;
          acc[endpoint] = (acc[endpoint] || 0) + 1;
          return acc;
        }, {});

        // Encontra o endpoint mais popular (SORT + primeiro elemento)
        const sortedEndpoints = Object.entries(endpointCounts)
          .sort((a, b) => b[1] - a[1]);

        const [most_popular, request_count] = sortedEndpoints[0];

        return {
          most_popular,
          request_count
        };
      });

      return Result.success(stats);
    } catch (error) {
      return Result.failure({
        message: 'Erro ao calcular endpoints populares',
        details: error.message,
        code: 'CALCULATION_ERROR'
      });
    }
  }

  /**
   * Helper: Retorna nome da categoria de status HTTP
   * @private
   * @param {number} category - Categoria (1-5)
   * @returns {string} Nome da categoria
   */
  getStatusCategoryName(category) {
    const categories = {
      1: 'informational',  // 1xx
      2: 'success',        // 2xx
      3: 'redirection',    // 3xx
      4: 'clientError',    // 4xx
      5: 'serverError'     // 5xx
    };
    return categories[category] || 'unknown';
  }

  /**
   * Limpa todos os logs (útil para testes)
   * @returns {Promise<Result>}
   */
  async clearAllLogs() {
    try {
      const deleted = await requestLogRepository.deleteAll();
      this.invalidateCache();
      return Result.success({ deletedCount: deleted });
    } catch (error) {
      return Result.failure({
        message: 'Erro ao limpar logs',
        details: error.message,
        code: 'DATABASE_ERROR'
      });
    }
  }
}

module.exports = new RequestLogService();
