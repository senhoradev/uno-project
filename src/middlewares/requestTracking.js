const requestLogService = require('../services/requestLogService');

/**
 * @fileoverview Middleware para rastreamento de requisições HTTP
 * 
 * Captura informações de cada requisição à API e salva no banco de dados:
 * - Endpoint acessado
 * - Método HTTP (GET, POST, PUT, DELETE)
 * - Status code da resposta
 * - Tempo de resposta em milissegundos
 * - Timestamp da requisição
 * - UserId (se autenticado)
 * 
 * O middleware intercepta a resposta para capturar o status code
 * e calcula o tempo total de processamento.
 * 
 * @module middlewares/requestTracking
 */

/**
 * Middleware de rastreamento de requisições
 * Usa pattern de interceptação da resposta para capturar métricas
 * 
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 */
const requestTracking = (req, res, next) => {
  // Marca o tempo de início da requisição
  const startTime = Date.now();
  
  // Captura o endpoint original (sem query strings para simplificar)
  const endpoint = req.originalUrl.split('?')[0];
  
  // Extrai userId se o usuário estiver autenticado (via middleware auth)
  // O middleware de auth define req.user com os dados do JWT
  const userId = req.user?.id ? String(req.user.id) : null;
  
  // Intercepta o método res.json para capturar o status code e salvar o log
  const originalJson = res.json.bind(res);
  
  res.json = function(body) {
    // Calcula o tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Captura o status code (pode ter sido setado antes com res.status())
    const statusCode = res.statusCode || 200;
    
    // Prepara os dados do log
    const logData = {
      endpointAccess: endpoint,
      requestMethod: req.method,
      statusCode: statusCode,
      responseTime: responseTime,
      timestamp: new Date(),
      userId: userId
    };
    
    // Salva o log de forma assíncrona (fire and forget)
    // Não aguarda para não atrasar a resposta ao cliente
    requestLogService.createRequestLog(logData)
      .catch(error => {
        // Log de erro silencioso - não deve afetar a requisição principal
        console.error('Erro ao salvar log de requisição:', error);
      });
    
    // Chama o método original res.json para enviar a resposta
    return originalJson(body);
  };
  
  // Intercepta também o método res.send (alguns endpoints podem usar)
  const originalSend = res.send.bind(res);
  
  res.send = function(body) {
    // Calcula o tempo de resposta
    const responseTime = Date.now() - startTime;
    
    // Captura o status code
    const statusCode = res.statusCode || 200;
    
    // Prepara os dados do log
    const logData = {
      endpointAccess: endpoint,
      requestMethod: req.method,
      statusCode: statusCode,
      responseTime: responseTime,
      timestamp: new Date(),
      userId: userId
    };
    
    // Salva o log de forma assíncrona
    requestLogService.createRequestLog(logData)
      .catch(error => {
        console.error('Erro ao salvar log de requisição:', error);
      });
    
    // Chama o método original res.send
    return originalSend(body);
  };
  
  // Continua para o próximo middleware/controller
  next();
};

module.exports = requestTracking;
