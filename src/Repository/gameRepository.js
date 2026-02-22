/**
 * @fileoverview Repositório responsável pelo acesso a dados da entidade Game
 * @module repositories/gameRepository
 */
const Game = require('../models/Game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');

/**
 * Classe que encapsula as operações de banco de dados para Jogos
 */
class GameRepository {

    /**
     * Cria um novo jogo no banco de dados
     * @param {Object} data - Dados do jogo (nome, regras, maxPlayers, etc.)
     * @returns {Promise<Game>} A instância do jogo criado
     */
    create(data) {
        return Game.create(data);
    }

    /**
     * Retorna todos os jogos cadastrados
     * @returns {Promise<Game[]>} Lista de todos os jogos
     */
    findAll() {
        return Game.findAll();
    }

    /**
     * Busca um jogo pelo seu ID
     * @param {number} id - ID do jogo
     * @returns {Promise<Game|null>} O jogo encontrado ou null
     */
    findById(id) {
        return Game.findByPk(id);
    }

    /**
     * Atualiza os dados de um jogo existente
     * @param {Object} data - Novos dados para atualização
     * @param {number} id - ID do jogo a ser atualizado
     * @returns {Promise<Game|null>} O jogo atualizado ou null se não encontrado
     */
    async update(data, id) {
        const [affectedRows] = await Game.update(data, {
            where: { id }
        });

        if (!affectedRows) {
            return null;
        }

        return this.findById(id);
    }

    /**
     * Remove um jogo do banco de dados
     * @param {number} id - ID do jogo a ser removido
     * @returns {Promise<boolean>} True se removido com sucesso, False caso contrário
     */
    async delete(id) {
        const deletedRows = await Game.destroy({
            where: { id }
        });

        return deletedRows > 0;
    }

    /**
     * Busca as pontuações atuais de todos os jogadores em um jogo específico.
     * @param {number} gameId - ID do jogo
     * @returns {Promise<Array<GamePlayer>>} Lista de GamePlayers com score e dados do Player associado
     */
    async getGameScores(gameId) {
        return await GamePlayer.findAll({
            where: { gameId },
            include: [{ 
                model: Player, 
                attributes: ['name'] // Garante o acesso ao nome para o DTO
            }],
            attributes: ['score'] // Recupera a pontuação atual do jogador na partida
        });
    }
}

module.exports = new GameRepository();
