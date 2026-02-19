const Game = require('../models/Game');

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
}

module.exports = new GameRepository();
