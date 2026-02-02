/**
 * @fileoverview Testes unitários para operações CRUD de Cards
 * @module tests/unit/card.test
 */

const {
  Card,
  Game,
  Player,
  setupTestDatabase,
  cleanDatabase,
  closeDatabase
} = require('../helpers/setupModels');

describe('Card CRUD Operations', () => {
  
  let testGame;
  let testPlayer;

  // Configuração antes de todos os testes
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // Limpeza após todos os testes
  afterAll(async () => {
    await closeDatabase();
  });

  // Limpa as tabelas e cria um jogo de teste antes de cada teste
  beforeEach(async () => {
    await cleanDatabase();
    
    testPlayer = await Player.create({
      username: 'card_tester',
      email: 'tester@email.com',
      password: 'senha123',
      name: 'Card Tester',
      age: 25
    });

    testGame = await Game.create({
      name: 'Card Test Game',
      creatorId: testPlayer.id
    });
  });

  describe('CREATE - Criar nova carta', () => {
    test('Deve criar uma nova carta com sucesso', async () => {
      const cardData = {
        color: 'red',
        action: '7',
        gameId: testGame.id
      };

      const card = await Card.create(cardData);

      expect(card).toBeDefined();
      expect(card.id).toBeDefined();
      expect(card.color).toBe(cardData.color);
      expect(card.action).toBe(cardData.action);
      expect(card.gameId).toBe(cardData.gameId);
    });

    test('Deve criar cartas com diferentes cores', async () => {
      const colors = ['red', 'blue', 'green', 'yellow'];
      
      for (const color of colors) {
        const card = await Card.create({
          color: color,
          action: '5',
          gameId: testGame.id
        });
        
        expect(card.color).toBe(color);
      }
    });

    test('Deve criar cartas com diferentes ações', async () => {
      const actions = ['skip', 'reverse', 'draw_two', '+2'];
      
      for (const action of actions) {
        const card = await Card.create({
          color: 'red',
          action: action,
          gameId: testGame.id
        });
        
        expect(card.action).toBe(action);
      }
    });

    test('Deve falhar ao criar carta sem cor', async () => {
      await expect(
        Card.create({
          action: '5',
          gameId: testGame.id
        })
      ).rejects.toThrow();
    });

    test('Deve falhar ao criar carta sem ação', async () => {
      await expect(
        Card.create({
          color: 'blue',
          gameId: testGame.id
        })
      ).rejects.toThrow();
    });

    test('Deve falhar ao criar carta sem gameId', async () => {
      await expect(
        Card.create({
          color: 'green',
          action: '3'
        })
      ).rejects.toThrow();
    });
  });

  describe('READ - Buscar cartas', () => {
    test('Deve buscar uma carta por ID', async () => {
      const cardData = {
        color: 'blue',
        action: 'skip',
        gameId: testGame.id
      };

      const createdCard = await Card.create(cardData);
      const foundCard = await Card.findByPk(createdCard.id);

      expect(foundCard).toBeDefined();
      expect(foundCard.id).toBe(createdCard.id);
      expect(foundCard.color).toBe(cardData.color);
      expect(foundCard.action).toBe(cardData.action);
    });

    test('Deve retornar null ao buscar carta inexistente', async () => {
      const foundCard = await Card.findByPk(9999);
      expect(foundCard).toBeNull();
    });

    test('Deve listar todas as cartas de um jogo', async () => {
      await Card.create({
        color: 'red',
        action: '1',
        gameId: testGame.id
      });

      await Card.create({
        color: 'blue',
        action: '2',
        gameId: testGame.id
      });

      const cards = await Card.findAll({ where: { gameId: testGame.id } });
      expect(cards).toHaveLength(2);
    });

    test('Deve buscar cartas por cor', async () => {
      await Card.create({
        color: 'red',
        action: '5',
        gameId: testGame.id
      });

      await Card.create({
        color: 'red',
        action: '7',
        gameId: testGame.id
      });

      await Card.create({
        color: 'blue',
        action: '3',
        gameId: testGame.id
      });

      const redCards = await Card.findAll({ where: { color: 'red', gameId: testGame.id } });
      expect(redCards).toHaveLength(2);
    });

    test('Deve ordenar cartas por data de criação', async () => {
      const card1 = await Card.create({
        color: 'red',
        action: '1',
        gameId: testGame.id
      });

      // Pequeno delay para garantir timestamps diferentes
      await new Promise(resolve => setTimeout(resolve, 10));

      const card2 = await Card.create({
        color: 'blue',
        action: '2',
        gameId: testGame.id
      });

      const cards = await Card.findAll({ 
        where: { gameId: testGame.id },
        order: [['createdAt', 'DESC'], ['id', 'DESC']]
      });

      expect(cards[0].id).toBe(card2.id);
      expect(cards[1].id).toBe(card1.id);
    });
  });

  describe('UPDATE - Atualizar carta', () => {
    test('Deve atualizar informações da carta com sucesso', async () => {
      const card = await Card.create({
        color: 'green',
        action: '4',
        gameId: testGame.id
      });

      await card.update({
        color: 'yellow',
        action: '8'
      });

      const updatedCard = await Card.findByPk(card.id);
      expect(updatedCard.color).toBe('yellow');
      expect(updatedCard.action).toBe('8');
    });

    test('Deve atualizar apenas a cor da carta', async () => {
      const card = await Card.create({
        color: 'red',
        action: 'reverse',
        gameId: testGame.id
      });

      const originalAction = card.action;
      await card.update({ color: 'blue' });

      const updatedCard = await Card.findByPk(card.id);
      expect(updatedCard.color).toBe('blue');
      expect(updatedCard.action).toBe(originalAction);
    });
  });

  describe('DELETE - Deletar carta', () => {
    test('Deve deletar uma carta com sucesso', async () => {
      const card = await Card.create({
        color: 'yellow',
        action: 'skip',
        gameId: testGame.id
      });

      const cardId = card.id;
      await card.destroy();

      const deletedCard = await Card.findByPk(cardId);
      expect(deletedCard).toBeNull();
    });

    test('Deve retornar 0 ao tentar deletar carta inexistente', async () => {
      const result = await Card.destroy({ where: { id: 9999 } });
      expect(result).toBe(0);
    });

    test('Deve deletar todas as cartas de um jogo', async () => {
      await Card.create({
        color: 'red',
        action: '1',
        gameId: testGame.id
      });

      await Card.create({
        color: 'blue',
        action: '2',
        gameId: testGame.id
      });

      await Card.destroy({ where: { gameId: testGame.id } });

      const remainingCards = await Card.findAll({ where: { gameId: testGame.id } });
      expect(remainingCards).toHaveLength(0);
    });
  });
});
