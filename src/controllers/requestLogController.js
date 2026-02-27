const requestLogService = require('../services/requestLogService');

/**
 * @fileoverview Controller de logs de requisições usando Result Monad
 * 
 * Implementa endpoints para estatísticas de API:
 * - GET /stats/requests - Estatísticas gerais de requisições
 * - GET /stats/response-times - Estatísticas de tempo de resposta
 * - GET /stats/status-codes - Estatísticas de códigos de status
 * - GET /stats/popular-endpoints - Endpoints mais acessados
 * 
 * Usa o método fold() do Result para pattern matching e tratamento de respostas HTTP
 * @module controllers/requestLogController
 */

/**
 * ENDPOINT 1: GET /stats/requests
 * Retorna estatísticas gerais das requisições
 * 
 * Response example:
 * {
 *   totalRequests: 1000,
 *   successfulRequests: 850,
 *   failedRequests: 150,
 *   successRate: 85.00,
 *   failureRate: 15.00,
 *   requestsByMethod: { GET: 600, POST: 300, PUT: 50, DELETE: 50 },
 *   authenticatedRequests: 700,
 *   unauthenticatedRequests: 300
 * }
 */
exports.getRequestStats = async (req, res) => {
  const result = await requestLogService.getRequestStats();
  
  result.fold(
    // onSuccess: retorna 200 OK
    (stats) => res.status(200).json({
      success: true,
      data: stats
    }),
    // onFailure: retorna erro apropriado
    (error) => {
      const status = error.code === 'DATABASE_ERROR' ? 500 : 400;
      res.status(status).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};

/**
 * ENDPOINT 2: GET /stats/response-times
 * Retorna estatísticas de tempos de resposta
 * 
 * Response example:
 * {
 *   averageResponseTime: 245.67,
 *   minResponseTime: 10,
 *   maxResponseTime: 5000,
 *   medianResponseTime: 200,
 *   p95ResponseTime: 800,
 *   p99ResponseTime: 1500,
 *   totalRequests: 1000,
 *   timeRanges: {
 *     fast: 500,
 *     medium: 350,
 *     slow: 100,
 *     verySlow: 50
 *   }
 * }
 */
exports.getResponseTimeStats = async (req, res) => {
  const result = await requestLogService.getResponseTimeStats();
  
  result.fold(
    // onSuccess: retorna 200 OK
    (stats) => res.status(200).json({
      success: true,
      data: stats
    }),
    // onFailure: retorna erro apropriado
    (error) => {
      const status = error.code === 'DATABASE_ERROR' ? 500 : 400;
      res.status(status).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};

/**
 * ENDPOINT 3: GET /stats/status-codes
 * Retorna estatísticas de códigos de status HTTP
 * 
 * Response example:
 * {
 *   totalRequests: 1000,
 *   statusCodeDistribution: [
 *     { statusCode: 200, count: 700, percentage: "70.00" },
 *     { statusCode: 404, count: 150, percentage: "15.00" },
 *     { statusCode: 500, count: 100, percentage: "10.00" }
 *   ],
 *   statusCategories: {
 *     success: 700,
 *     clientError: 200,
 *     serverError: 100
 *   },
 *   topStatusCodes: [...],
 *   errorCodes: [...],
 *   uniqueStatusCodes: 5
 * }
 */
exports.getStatusCodeStats = async (req, res) => {
  const result = await requestLogService.getStatusCodeStats();
  
  result.fold(
    // onSuccess: retorna 200 OK
    (stats) => res.status(200).json({
      success: true,
      data: stats
    }),
    // onFailure: retorna erro apropriado
    (error) => {
      const status = error.code === 'DATABASE_ERROR' ? 500 : 400;
      res.status(status).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};

/**
 * ENDPOINT 4: GET /stats/popular-endpoints
 * Retorna endpoints mais acessados
 * 
 * Response example:
 * {
 *   totalEndpoints: 25,
 *   totalRequests: 1000,
 *   topEndpoints: [
 *     {
 *       endpoint: "/api/games",
 *       totalRequests: 300,
 *       percentage: "30.00",
 *       methods: { GET: 200, POST: 100 },
 *       avgResponseTime: 245.5
 *     },
 *     ...
 *   ],
 *   allEndpoints: [...],
 *   topEndpointMethods: [...]
 * }
 */
exports.getPopularEndpoints = async (req, res) => {
  const result = await requestLogService.getPopularEndpoints();
  
  result.fold(
    // onSuccess: retorna 200 OK
    (stats) => res.status(200).json({
      success: true,
      data: stats
    }),
    // onFailure: retorna erro apropriado
    (error) => {
      const status = error.code === 'DATABASE_ERROR' ? 500 : 400;
      res.status(status).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};

/**
 * GET /stats/requests/all
 * Retorna todos os logs de requisições (para debug/admin)
 */
exports.getAllRequestLogs = async (req, res) => {
  const result = await requestLogService.getAllRequestLogs();
  
  result.fold(
    (logs) => res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    }),
    (error) => {
      const status = error.code === 'DATABASE_ERROR' ? 500 : 400;
      res.status(status).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};

/**
 * DELETE /stats/requests/all
 * Limpa todos os logs (útil para testes)
 */
exports.clearAllLogs = async (req, res) => {
  const result = await requestLogService.clearAllLogs();
  
  result.fold(
    (data) => res.status(200).json({
      success: true,
      message: 'Todos os logs foram removidos',
      deletedCount: data.deletedCount
    }),
    (error) => {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};
