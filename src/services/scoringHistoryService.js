const scoringHistory = require('../models/scoringHistory');
 
class ScoringHistoryService {
  // Cria um novo score recebendo os dados do controller
  async createScore(data) {
    return await scoringHistory.create(data);
  }
 
  // Busca um score pelo ID
  async getScoreById(id) {
    const score = await scoringHistory.findByPk(id);
    if (!score) throw new Error('Score não encontrado');
    return score;
  }
 
  // Atualiza os dados de um score existente
  async updateScore(id, data) {
    // Reutiliza o método getScoreById para garantir que o score existe antes de atualizar
    const score = await this.getScoreById(id);
    return await score.update(data);
  }
 
  // Remove um score do banco de dados
  async deleteScore(id) {
    // Busca o score para garantir que ele existe antes da exclusão
    const score = await this.getScoreById(id);
    await score.destroy();
    return { message: 'Score removido com sucesso' };
  }

  async createscoringHistory(data) {
    return await scoringHistory.create(data);
  }
}
 
// Exporta uma instância única do serviço para ser usada
module.exports = new ScoringHistoryService();