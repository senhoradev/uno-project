const cardController = require('../../src/controllers/cardController');
const cardService = require('../../src/services/cardService');

jest.mock('../../src/services/cardService');

describe('CardController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('retorna 201 quando carta criada com sucesso', async () => {
      const mockCard = { id: 1, color: 'red', action: 'skip', gameId: 1 };
      cardService.createCard.mockResolvedValue(mockCard);

      req.body = { color: 'red', action: 'skip', gameId: 1 };

      await cardController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    test('retorna 400 quando criação falha', async () => {
      cardService.createCard.mockRejectedValue(new Error('Cor inválida'));

      req.body = { color: 'invalid', action: 'skip' };

      await cardController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cor inválida' });
    });
  });

  describe('getById', () => {
    test('retorna 200 quando carta existe', async () => {
      const mockCard = { id: 1, color: 'blue', action: 'reverse' };
      cardService.getCardById.mockResolvedValue(mockCard);

      req.params.id = 1;

      await cardController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    test('retorna 404 quando carta não existe', async () => {
      cardService.getCardById.mockRejectedValue(new Error('Carta não encontrada'));

      req.params.id = 999;

      await cardController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Carta não encontrada' });
    });
  });

  describe('update', () => {
    test('retorna 200 quando atualização bem-sucedida', async () => {
      const mockCard = { id: 1, color: 'green', action: 'draw2' };
      cardService.updateCard.mockResolvedValue(mockCard);

      req.params.id = 1;
      req.body = { color: 'green' };

      await cardController.update(req, res);

      expect(res.json).toHaveBeenCalledWith(mockCard);
    });

    test('retorna 400 quando atualização falha', async () => {
      cardService.updateCard.mockRejectedValue(new Error('Carta não encontrada'));

      req.params.id = 999;
      req.body = { color: 'green' };

      await cardController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('delete', () => {
    test('retorna 200 quando remoção bem-sucedida', async () => {
      const mockResult = { message: 'Carta removida com sucesso' };
      cardService.deleteCard.mockResolvedValue(mockResult);

      req.params.id = 1;

      await cardController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('retorna 404 quando carta não existe', async () => {
      cardService.deleteCard.mockRejectedValue(new Error('Carta não encontrada'));

      req.params.id = 999;

      await cardController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
