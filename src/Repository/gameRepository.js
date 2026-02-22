const Game = require('../models/Game');
const GamePlayer = require('../models/gamePlayer');
const Player = require('../models/player');

class GameRepository {

    /**
     * Cria um novo jogo
     * @param {Object} data
     * @returns {Promise<Game>}
     */
    create(data) {
        return Game.create(data);
    }

    /**
     * Retorna todos os jogos
     * @returns {Promise<Game[]>}
     */
    findAll() {
        return Game.findAll();
    }

    /**
     * Busca jogo por ID
     * @param {number} id
     * @returns {Promise<Game|null>}
     */
    findById(id) {
        return Game.findByPk(id);
    }

    /**
     * Atualiza um jogo
     * @param {Object} data
     * @param {number} id
     * @returns {Promise<Game|null>}
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
     * Deleta um jogo
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const deletedRows = await Game.destroy({
            where: { id }
        });

        return deletedRows > 0;
    }

    /**
     * Busca as pontuações atuais de todos os jogadores em um jogo específico.
     * @param {number} gameId 
     * @returns {Promise<GamePlayer[]>}
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
