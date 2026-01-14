const Card = require('../models/card');

class CardService {
  async createCard(data) {
    return await Card.create(data);
  }

  async getCardById(id) {
    const card = await Card.findByPk(id);
    if (!card) throw new Error('Cartão não encontrado');
    return card;
  }

  async updateCard(id, data) {
    const card = await this.getCardById(id);
    return await card.update(data);
  }

  async deleteCard(id) {
    const card = await this.getCardById(id);
    await card.destroy();
    return { message: 'Cartão removido com sucesso' };
  }


  async initCards() { // Initialize cards if none exist
    const count = await Card.count();
    if (count === 0) {
      await Card.create({ color: "blue", action: "3", gameId: 1 });
      await Card.create({ color: "red", action: "Skip", gameId: 1 });
      await Card.create({ color: "black", action: "buyFour", gameId: 1 });
      console.log("Baralho de Uno inicializado!");
    }
  }
}

module.exports = new CardService();