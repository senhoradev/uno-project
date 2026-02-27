const Card = require('../models/Card');


class CardRepository {


    async saveCard(card) {
        return await Card.create(card);
    }

    async findAll() {
        return await Card.findAll();
    }

    async findById(id) {
        return await Card.findByPk(id);
    }

    async updateCard(card, id) {
        const cardExist = await this.findById(id);

        if (!cardExist) {
            return null;
        }

        await Card.update(card, {
            where: { id }
        });

        return await this.findById(id);
    }

    async deleteById(id) {
        const cardExist = await this.findById(id);

        if (!cardExist) {
            return null;
        }

        return await Card.destroy({
            where: { id }
        });
    }
}
module.exports = new CardRepository();