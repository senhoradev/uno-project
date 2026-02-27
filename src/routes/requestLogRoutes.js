const express = require('express');
const router = express.Router();

/**
 * @fileoverview Rotas para estatísticas de requisições
 * 
 * Implementa os 4 endpoints principais:
 * - GET /stats/requests - Estatísticas gerais de requisições
 * - GET /stats/response-times - Estatísticas de tempo de resposta
 * - GET /stats/status-codes - Estatísticas de códigos de status
 * - GET /stats/popular-endpoints - Endpoints mais acessados
 * 
 * Adicionalmente:
 * - GET /stats/requests/all - Lista todos os logs (admin/debug)
 * - DELETE /stats/requests/all - Limpa todos os logs (testes)
 * 
 * @module routes/requestLogRoutes
 */

// Importa o controller de logs de requisições
const requestLogController = require('../controllers/requestLogController');

// ========== ENDPOINTS PRINCIPAIS DA ATIVIDADE ==========

/**
 * ENDPOINT 1: GET /stats/requests
 * Retorna estatísticas gerais das requisições
 * - Total de requisições
 * - Requisições bem-sucedidas
 * - Requisições com erro
 * - Taxa de sucesso/erro
 * - Requisições por método HTTP
 * - Requisições autenticadas vs não autenticadas
 */
router.get('/requests', requestLogController.getRequestStats);

/**
 * ENDPOINT 2: GET /stats/response-times
 * Retorna estatísticas de tempos de resposta
 * - Tempo médio de resposta
 * - Tempo mínimo e máximo
 * - Mediana
 * - Percentil 95 e 99
 * - Distribuição por faixas de tempo
 */
router.get('/response-times', requestLogController.getResponseTimeStats);

/**
 * ENDPOINT 3: GET /stats/status-codes
 * Retorna estatísticas de códigos de status HTTP
 * - Distribuição por código de status
 * - Categorias de status (2xx, 3xx, 4xx, 5xx)
 * - Top 5 status codes
 * - Códigos de erro
 */
router.get('/status-codes', requestLogController.getStatusCodeStats);

/**
 * ENDPOINT 4: GET /stats/popular-endpoints
 * Retorna endpoints mais acessados
 * - Top 10 endpoints
 * - Total de requisições por endpoint
 * - Métodos HTTP utilizados em cada endpoint
 * - Tempo médio de resposta por endpoint
 * - Top combinações endpoint+método
 */
router.get('/popular-endpoints', requestLogController.getPopularEndpoints);

// ========== ENDPOINTS AUXILIARES ==========

/**
 * GET /stats/requests/all
 * Lista todos os logs de requisições
 * Útil para debug e administração
 */
router.get('/requests/all', requestLogController.getAllRequestLogs);

/**
 * DELETE /stats/requests/all
 * Remove todos os logs de requisições
 * Útil para testes e limpeza
 */
router.delete('/requests/all', requestLogController.clearAllLogs);

// Exporta o roteador
module.exports = router;
