const scoringHistory = require('../models/scoringHistory');
const Result = require('../utils/Result');

/**
 * @fileoverview Serviço de histórico de pontuação implementado com Result Monad
 * 
 * Implementa Functors e Monads para:
 * - Tornar erros explícitos
 * - Facilitar composição de operações
 * - Melhorar testabilidade
 * - Seguir Railway-Oriented Programming
 */
class ScoringHistoryService {
  /**
   * Valida dados de pontuação usando Functor (map)
   * @param {Object} data - Dados a validar
   * @returns {Result} Result.success(data) ou Result.failure(error)
   */
  validateScoreData(data) {
    // Validação de campo obrigatório
    if (data.score === undefined || data.score === null) {
      return Result.failure({
        message: 'A pontuação (score) é obrigatória',
        field: 'score',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validação de tipo
    if (typeof data.score !== 'number') {
      return Result.failure({
        message: 'A pontuação deve ser um número',
        field: 'score',
        code: 'VALIDATION_ERROR'
      });
    }

    return Result.success(data);
  }

  /**
   * Cria um novo score usando Result Monad
   * Demonstra uso de map (Functor) e flatMap (Monad)
   * 
   * @param {Object} data - Dados do score
   * @returns {Promise<Result>} Result.success(score) ou Result.failure(error)
   */
  async createScore(data) {
    // Validação usando Functor
    const validationResult = this.validateScoreData(data);
    
    if (!validationResult.isSuccess) {
      return validationResult;
    }

    

    // Operação de banco usando flatMap para composição
    try {
      const score = await scoringHistory.create(data);
      
      // Transforma o resultado usando map (Functor)
      return Result.success(score).map(s => ({
        id: s.id,
        score: s.score,
        playerId: s.playerId,
        gameId: s.gameId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));
    } catch (error) {
      return Result.failure({
        message: 'Erro ao criar pontuação no banco de dados',
        details: error.message,
        code: 'DATABASE_ERROR'
      });
    }
  }

  /**
   * Busca score por ID usando Result Monad
   * @param {number} id - ID do score
   * @returns {Promise<Result>} Result.success(score) ou Result.failure(error)
   */
  async getScoreById(id) {
    try {
      const score = await scoringHistory.findByPk(id);
      
      if (!score) {
        return Result.failure({
          message: 'Score não encontrado',
          id: id,
          code: 'NOT_FOUND'
        });
      }

      return Result.success(score);
    } catch (error) {
      return Result.failure({
        message: 'Erro ao buscar pontuação',
        details: error.message,
        code: 'DATABASE_ERROR'
      });
    }
  }

  /**
   * Atualiza score usando flatMap (Monad) para composição
   * Demonstra Railway-Oriented Programming
   * 
   * @param {number} id - ID do score
   * @param {Object} data - Novos dados
   * @returns {Promise<Result>} Result com score atualizado ou erro
   */
  async updateScore(id, data) {
    // Busca o score
    const scoreResult = await this.getScoreById(id);
    
    // Usa flatMap para compor: buscar -> validar -> atualizar
    // Se qualquer operação falhar, o erro é propagado automaticamente
    return scoreResult.flatMap(score => {
      const validationResult = this.validateScoreData(data);
      
      return validationResult.flatMap(async (validData) => {
        try {
          const updated = await score.update(validData);
          
          // Usa map para transformar o resultado
          return Result.success(updated).map(s => ({
            id: s.id,
            score: s.score,
            playerId: s.playerId,
            gameId: s.gameId,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt
          }));
        } catch (error) {
          return Result.failure({
            message: 'Erro ao atualizar pontuação',
            details: error.message,
            code: 'DATABASE_ERROR'
          });
        }
      });
    });
  }

  /**
   * Remove score usando flatMap (Monad)
   * @param {number} id - ID do score a remover
   * @returns {Promise<Result>} Result com mensagem de sucesso ou erro
   */
  async deleteScore(id) {
    const scoreResult = await this.getScoreById(id);
    
    // Composição: buscar -> deletar
    return scoreResult.flatMap(async (score) => {
      try {
        await score.destroy();
        return Result.success({
          message: 'Score removido com sucesso',
          id: id
        });
      } catch (error) {
        return Result.failure({
          message: 'Erro ao remover pontuação',
          details: error.message,
          code: 'DATABASE_ERROR'
        });
      }
    });
  }

  /**
   * Lista todos os scores usando Result Monad
   * @returns {Promise<Result>} Result com array de scores ou erro
   */
  async getAllScores() {
    try {
      const scores = await scoringHistory.findAll();
      
      // Usa map para transformar cada score
      return Result.success(scores).map(scoreList => 
        scoreList.map(s => ({
          id: s.id,
          score: s.score,
          playerId: s.playerId,
          gameId: s.gameId,
          createdAt: s.createdAt
        }))
      );
    } catch (error) {
      return Result.failure({
        message: 'Erro ao listar pontuações',
        details: error.message,
        code: 'DATABASE_ERROR'
      });
    }
  }
}
 
// Exporta uma instância única do serviço para ser usada
module.exports = new ScoringHistoryService();