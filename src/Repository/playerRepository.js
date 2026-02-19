
const Player = require('../models/Player');

class PlayerRepository {

    // CREATE
    async save(playerData) {
        return await Player.create(playerData);
    }

    // READ
    async findAll() {
        return await Player.findAll();
    }

    async findById(id) {
        return await Player.findByPk(id);
    }

    async findByUsername(username) {
        return await Player.findOne({
            where: { username }
        });
    }

    async findByEmail(email) {
        return await Player.findOne({
            where: { email }
        });
    }

    // UPDATE
    async update(id, playerData) {
        const player = await Player.findByPk(id);
        if (!player) return null;

        return await player.update(playerData);
    }

    // DELETE
    async deleteById(id) {
        return await Player.destroy({
            where: { id }
        });
    }

    // EXISTS (extra útil)
    async existsByUsername(username) {
        const count = await Player.count({
            where: { username }
        });
        return count > 0;
    }

    async existsByEmail(email) {
        const count = await Player.count({
            where: { email }
        });
        return count > 0;
    }
}

module.exports = new PlayerRepository();
