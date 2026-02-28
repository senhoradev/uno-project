const Card = require('../models/card');

const CardRepository = require('../Repository/cardRepository');

class CardService {
  async createCard(data) {
    return await CardRepository.saveCard(data);
  }

  async getCardById(id) {
    const card = await CardRepository.findById(id);
    if (!card) throw new Error('Cartão não encontrado');
    return card;
  }

  async updateCard(id, data) {
    const card = await this.getCardById(id);
    if (!card) throw new Error('Cartão não encontrado')

    return await CardRepository.updateCard(id, data);
  }

  async deleteCard(id) {
    const card = await this.getCardById(id);
    if (!card) throw new Error('Cartão não encontrado')
    await CardRepository.deleteById(card.id);
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