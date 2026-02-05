const scoringHistoryService = require('../services/scoringHistoryService');

/**
 * @fileoverview Controller de histórico de pontuação usando Result Monad
 * 
 * Usa o método fold() do Result para pattern matching e tratamento de respostas HTTP
 */

/**
 * Cria um novo score
 * Usa fold para tratar Success e Failure de forma elegante
 */
exports.create = async (req, res) => {
  const result = await scoringHistoryService.createScore(req.body);
  
  // Pattern matching com fold: trata success e failure
  result.fold(
    // onSuccess: retorna 201 Created
    (score) => res.status(201).json(score),
    // onFailure: retorna 400 Bad Request
    (error) => res.status(400).json({ 
      error: error.message,
      code: error.code,
      field: error.field,
      details: error.details
    })
  );
};

/**
 * Busca score por ID
 * Usa fold para diferenciar entre NOT_FOUND e outros erros
 */
exports.getById = async (req, res) => {
  const result = await scoringHistoryService.getScoreById(req.params.id);
  
  result.fold(
    // onSuccess: retorna 200 OK
    (score) => res.json(score),
    // onFailure: 404 se não encontrado, 500 para outros erros
    (error) => {
      const status = error.code === 'NOT_FOUND' ? 404 : 500;
      res.status(status).json({ 
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};

/**
 * Atualiza score existente
 * Demonstra Railway-Oriented Programming no controller
 */
exports.update = async (req, res) => {
  const result = await scoringHistoryService.updateScore(req.params.id, req.body);
  
  result.fold(
    // onSuccess: retorna 200 OK com score atualizado
    (score) => res.json(score),
    // onFailure: diferencia tipos de erro
    (error) => {
      const statusMap = {
        'NOT_FOUND': 404,
        'VALIDATION_ERROR': 400,
        'DATABASE_ERROR': 500
      };
      const status = statusMap[error.code] || 500;
      res.status(status).json({ 
        error: error.message,
        code: error.code,
        field: error.field,
        details: error.details
      });
    }
  );
};

/**
 * Remove score por ID
 */
exports.delete = async (req, res) => {
  const result = await scoringHistoryService.deleteScore(req.params.id);
  
  result.fold(
    // onSuccess: retorna 200 OK com mensagem
    (data) => res.json(data),
    // onFailure: 404 se não encontrado, 500 para outros erros
    (error) => {
      const status = error.code === 'NOT_FOUND' ? 404 : 500;
      res.status(status).json({ 
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  );
};

/**
 * Lista todos os scores
 */
exports.getAll = async (req, res) => {
  const result = await scoringHistoryService.getAllScores();
  
  result.fold(
    (scores) => res.json(scores),
    (error) => res.status(500).json({ 
      error: error.message,
      code: error.code,
      details: error.details
    })
  );
};