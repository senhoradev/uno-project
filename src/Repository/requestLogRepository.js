const RequestLog = require('../models/requestLog');

/**
 * @fileoverview Repositório para operações de persistência do modelo RequestLog.
 * Implementa operações CRUD e consultas específicas para logs de requisições.
 * @module Repository/requestLogRepository
 */

/**
 * Repositório para gerenciar dados de logs de requisições no banco de dados.
 * Segue o padrão Repository para abstrair a lógica de acesso a dados.
 * @class RequestLogRepository
 */
class RequestLogRepository {
  /**
   * CREATE - Salva um novo log de requisição no banco de dados
   * @param {Object} requestLogData - Dados do log de requisição
   * @param {string} requestLogData.endpointAccess - Endpoint acessado
   * @param {string} requestLogData.requestMethod - Método HTTP
   * @param {number} requestLogData.statusCode - Código de status da resposta
   * @param {number} requestLogData.responseTime - Tempo de resposta em ms
   * @param {Date} requestLogData.timestamp - Data e hora da requisição
   * @param {string} [requestLogData.userId] - ID do usuário (opcional)
   * @returns {Promise<RequestLog>} Log de requisição criado
   */
  async save(requestLogData) {
    return await RequestLog.create(requestLogData);
  }

  /**
   * READ - Busca todos os logs de requisições
   * @returns {Promise<Array<RequestLog>>} Array com todos os logs
   */
  async findAll() {
    return await RequestLog.findAll({
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * READ - Busca log de requisição por ID
   * @param {number} id - ID do log
   * @returns {Promise<RequestLog|null>} Log encontrado ou null
   */
  async findById(id) {
    return await RequestLog.findByPk(id);
  }

  /**
   * READ - Busca logs de requisições por userId
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array<RequestLog>>} Array de logs do usuário
   */
  async findByUserId(userId) {
    return await RequestLog.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * READ - Busca logs de requisições por endpoint
   * @param {string} endpointAccess - Endpoint a buscar
   * @returns {Promise<Array<RequestLog>>} Array de logs do endpoint
   */
  async findByEndpoint(endpointAccess) {
    return await RequestLog.findAll({
      where: { endpointAccess },
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * READ - Busca logs de requisições por método HTTP
   * @param {string} requestMethod - Método HTTP (GET, POST, etc.)
   * @returns {Promise<Array<RequestLog>>} Array de logs do método
   */
  async findByMethod(requestMethod) {
    return await RequestLog.findAll({
      where: { requestMethod },
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * READ - Busca logs de requisições por código de status
   * @param {number} statusCode - Código de status HTTP
   * @returns {Promise<Array<RequestLog>>} Array de logs com o status code
   */
  async findByStatusCode(statusCode) {
    return await RequestLog.findAll({
      where: { statusCode },
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * DELETE - Remove log de requisição por ID
   * @param {number} id - ID do log a ser removido
   * @returns {Promise<number>} Número de registros removidos
   */
  async deleteById(id) {
    return await RequestLog.destroy({
      where: { id }
    });
  }

  /**
   * DELETE - Remove todos os logs de requisições
   * @returns {Promise<number>} Número de registros removidos
   */
  async deleteAll() {
    return await RequestLog.destroy({
      where: {},
      truncate: true
    });
  }

  /**
   * COUNT - Conta total de logs de requisições
   * @returns {Promise<number>} Número total de logs
   */
  async count() {
    return await RequestLog.count();
  }
}

module.exports = new RequestLogRepository();
