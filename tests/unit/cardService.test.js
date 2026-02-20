const cardService = require('../../src/services/cardService');
const Card = require('../../src/models/card');

jest.mock('../../src/models/card');

describe('CardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCard', () => {
    test('cria nova carta com sucesso', async () => {
      const mockCard = { id: 1, color: 'red', action: 'Skip', gameId: 1 };
      Card.create.mockResolvedValue(mockCard);

      const result = await cardService.createCard({ color: 'red', action: 'Skip', gameId: 1 });

      expect(result).toEqual(mockCard);
      expect(Card.create).toHaveBeenCalledWith({ color: 'red', action: 'Skip', gameId: 1 });
    });
  });

  describe('getCardById', () => {
    test('retorna carta quando encontrada', async () => {
      const mockCard = { id: 1, color: 'blue', action: '5' };
      Card.findByPk.mockResolvedValue(mockCard);

      const result = await cardService.getCardById(1);

      expect(result).toEqual(mockCard);
    });

    test('lança erro quando carta não encontrada', async () => {
      Card.findByPk.mockResolvedValue(null);

      await expect(cardService.getCardById(999)).rejects.toThrow('Cartão não encontrado');
    });
  });

  describe('updateCard', () => {
    test('atualiza carta existente', async () => {
      const mockCard = {
        id: 1,
        color: 'blue',
        action: '3',
        update: jest.fn().mockResolvedValue({ id: 1, color: 'red', action: '3' })
      };
      Card.findByPk.mockResolvedValue(mockCard);

      const result = await cardService.updateCard(1, { color: 'red' });

      expect(mockCard.update).toHaveBeenCalledWith({ color: 'red' });
    });

    test('lança erro quando carta não existe', async () => {
      Card.findByPk.mockResolvedValue(null);

      await expect(cardService.updateCard(999, { color: 'red' })).rejects.toThrow();
    });
  });

  describe('deleteCard', () => {
    test('remove carta com sucesso', async () => {
      const mockCard = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      Card.findByPk.mockResolvedValue(mockCard);

      const result = await cardService.deleteCard(1);

      expect(mockCard.destroy).toHaveBeenCalled();
      expect(result.message).toBe('Cartão removido com sucesso');
    });

    test('lança erro quando carta não existe', async () => {
      Card.findByPk.mockResolvedValue(null);

      await expect(cardService.deleteCard(999)).rejects.toThrow();
    });
  });

  describe('initCards', () => {
    test('inicializa cartas quando não há nenhuma', async () => {
      Card.count.mockResolvedValue(0);
      Card.create.mockResolvedValue({});
      console.log = jest.fn();

      await cardService.initCards();

      expect(Card.create).toHaveBeenCalledTimes(3);
      expect(Card.create).toHaveBeenCalledWith({ color: 'blue', action: '3', gameId: 1 });
      expect(Card.create).toHaveBeenCalledWith({ color: 'red', action: 'Skip', gameId: 1 });
      expect(Card.create).toHaveBeenCalledWith({ color: 'black', action: 'buyFour', gameId: 1 });
      expect(console.log).toHaveBeenCalledWith('Baralho de Uno inicializado!');
    });

    test('não inicializa cartas quando já existem', async () => {
      Card.count.mockResolvedValue(5);

      await cardService.initCards();

      expect(Card.create).not.toHaveBeenCalled();
    });
  });
});
