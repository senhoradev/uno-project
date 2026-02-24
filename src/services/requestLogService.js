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
   * 
   * Usa:
   * - Filter: para filtrar por critérios
   * - Reduce: para contar (accumulator)
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
        const totalRequests = logs.length;

        // FILTER + ACCUMULATOR - Conta requisições bem-sucedidas (2xx)
        const successfulRequests = logs
          .filter(log => log.statusCode >= 200 && log.statusCode < 300)
          .length;

        // FILTER + ACCUMULATOR - Conta requisições com erro (4xx e 5xx)
        const failedRequests = logs
          .filter(log => log.statusCode >= 400)
          .length;

        // REDUCE (ACCUMULATOR) - Agrupa requisições por método HTTP
        const requestsByMethod = logs.reduce((acc, log) => {
          acc[log.requestMethod] = (acc[log.requestMethod] || 0) + 1;
          return acc;
        }, {});

        // FILTER + MAP - Requisições com userId (autenticadas)
        const authenticatedRequests = logs
          .filter(log => log.userId !== null && log.userId !== undefined)
          .length;

        // Calcula taxas percentuais
        const successRate = totalRequests > 0 
          ? ((successfulRequests / totalRequests) * 100).toFixed(2)
          : 0;

        const failureRate = totalRequests > 0 
          ? ((failedRequests / totalRequests) * 100).toFixed(2)
          : 0;

        return {
          totalRequests,
          successfulRequests,
          failedRequests,
          successRate: parseFloat(successRate),
          failureRate: parseFloat(failureRate),
          requestsByMethod,
          authenticatedRequests,
          unauthenticatedRequests: totalRequests - authenticatedRequests
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
   * Retorna estatísticas de tempos de resposta
   * 
   * Usa:
   * - Map: para extrair tempos
   * - Reduce: para somar e calcular médias (accumulator)
   * - Sort: para ordenar
   * - Filter: para remover outliers
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
          return {
            averageResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            medianResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            totalRequests: 0
          };
        }

        // MAP - Extrai apenas os tempos de resposta
        const responseTimes = logs.map(log => log.responseTime);

        // REDUCE (ACCUMULATOR) - Calcula soma total
        const totalTime = responseTimes.reduce((acc, time) => acc + time, 0);

        // Calcula média
        const averageResponseTime = totalTime / responseTimes.length;

        // SORT - Ordena para calcular mediana e percentis
        const sortedTimes = [...responseTimes].sort((a, b) => a - b);

        // Calcula mediana
        const medianIndex = Math.floor(sortedTimes.length / 2);
        const medianResponseTime = sortedTimes.length % 2 === 0
          ? (sortedTimes[medianIndex - 1] + sortedTimes[medianIndex]) / 2
          : sortedTimes[medianIndex];

        // Calcula percentil 95 (P95)
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p95ResponseTime = sortedTimes[p95Index] || sortedTimes[sortedTimes.length - 1];

        // Calcula percentil 99 (P99)
        const p99Index = Math.floor(sortedTimes.length * 0.99);
        const p99ResponseTime = sortedTimes[p99Index] || sortedTimes[sortedTimes.length - 1];

        // Min e Max
        const minResponseTime = sortedTimes[0];
        const maxResponseTime = sortedTimes[sortedTimes.length - 1];

        // REDUCE - Agrupa por faixas de tempo
        const timeRanges = responseTimes.reduce((acc, time) => {
          if (time < 100) acc.fast++;
          else if (time < 500) acc.medium++;
          else if (time < 1000) acc.slow++;
          else acc.verySlow++;
          return acc;
        }, { fast: 0, medium: 0, slow: 0, verySlow: 0 });

        return {
          averageResponseTime: Math.round(averageResponseTime * 100) / 100,
          minResponseTime,
          maxResponseTime,
          medianResponseTime: Math.round(medianResponseTime * 100) / 100,
          p95ResponseTime,
          p99ResponseTime,
          totalRequests: logs.length,
          timeRanges: {
            fast: timeRanges.fast,           // < 100ms
            medium: timeRanges.medium,       // 100-500ms
            slow: timeRanges.slow,           // 500-1000ms
            verySlow: timeRanges.verySlow    // > 1000ms
          }
        };
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
   * 
   * Usa:
   * - Reduce: para agrupar por status code (accumulator)
   * - Map: para transformar dados
   * - Filter: para categorizar por tipo de status
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
        const statusCodeCounts = logs.reduce((acc, log) => {
          acc[log.statusCode] = (acc[log.statusCode] || 0) + 1;
          return acc;
        }, {});

        // MAP - Transforma objeto em array ordenado
        const statusCodeDistribution = Object.entries(statusCodeCounts)
          .map(([code, count]) => ({
            statusCode: parseInt(code),
            count,
            percentage: ((count / logs.length) * 100).toFixed(2)
          }))
          .sort((a, b) => b.count - a.count);

        // FILTER + REDUCE - Categoriza por tipo de status (1xx, 2xx, 3xx, 4xx, 5xx)
        const statusCategories = logs.reduce((acc, log) => {
          const category = Math.floor(log.statusCode / 100);
          const categoryName = this.getStatusCategoryName(category);
          acc[categoryName] = (acc[categoryName] || 0) + 1;
          return acc;
        }, {});

        // FILTER - Identifica os status codes mais comuns (top 5)
        const topStatusCodes = statusCodeDistribution.slice(0, 5);

        // FILTER - Lista códigos de erro (4xx e 5xx)
        const errorCodes = statusCodeDistribution
          .filter(stat => stat.statusCode >= 400);

        return {
          totalRequests: logs.length,
          statusCodeDistribution,
          statusCategories,
          topStatusCodes,
          errorCodes,
          uniqueStatusCodes: Object.keys(statusCodeCounts).length
        };
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
   * 
   * Usa:
   * - Reduce: para contar acessos por endpoint (accumulator)
   * - Map: para transformar dados
   * - Sort: para ordenar por popularidade
   * - Filter: para filtrar por método HTTP
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
        // REDUCE (ACCUMULATOR) - Agrupa por endpoint
        const endpointCounts = logs.reduce((acc, log) => {
          const key = log.endpointAccess;
          if (!acc[key]) {
            acc[key] = {
              endpoint: key,
              totalRequests: 0,
              methods: {},
              avgResponseTime: 0,
              responseTimes: []
            };
          }
          acc[key].totalRequests++;
          acc[key].methods[log.requestMethod] = (acc[key].methods[log.requestMethod] || 0) + 1;
          acc[key].responseTimes.push(log.responseTime);
          return acc;
        }, {});

        // MAP + PIPE - Transforma e calcula médias de tempo de resposta
        const endpointStats = Object.values(endpointCounts)
          .map(endpoint => {
            // Calcula tempo médio de resposta
            const avgResponseTime = endpoint.responseTimes.reduce((sum, time) => sum + time, 0) / endpoint.responseTimes.length;
            
            return {
              endpoint: endpoint.endpoint,
              totalRequests: endpoint.totalRequests,
              percentage: ((endpoint.totalRequests / logs.length) * 100).toFixed(2),
              methods: endpoint.methods,
              avgResponseTime: Math.round(avgResponseTime * 100) / 100
            };
          })
          .sort((a, b) => b.totalRequests - a.totalRequests);

        // FILTER - Top 10 endpoints mais acessados
        const topEndpoints = endpointStats.slice(0, 10);

        // REDUCE - Agrupa por combinação endpoint + método
        const endpointMethodCombinations = logs.reduce((acc, log) => {
          const key = `${log.requestMethod} ${log.endpointAccess}`;
          if (!acc[key]) {
            acc[key] = {
              method: log.requestMethod,
              endpoint: log.endpointAccess,
              count: 0
            };
          }
          acc[key].count++;
          return acc;
        }, {});

        // MAP + SORT - Top combinações endpoint+método
        const topEndpointMethods = Object.values(endpointMethodCombinations)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return {
          totalEndpoints: endpointStats.length,
          totalRequests: logs.length,
          topEndpoints,
          allEndpoints: endpointStats,
          topEndpointMethods
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
