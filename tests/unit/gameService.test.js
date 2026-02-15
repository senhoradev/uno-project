const gameService = require('../../src/services/gameService');
const Game = require('../../src/models/game');
const GamePlayer = require('../../src/models/gamePlayer');
const Player = require('../../src/models/player');

jest.mock('../../src/models/game');
jest.mock('../../src/models/gamePlayer');
jest.mock('../../src/models/player');

describe('GameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGame', () => {
    test('cria novo jogo e adiciona criador', async () => {
      const mockGame = { id: 1, name: 'Test Game', status: 'waiting', creatorId: 1 };
      Game.create.mockResolvedValue(mockGame);
      GamePlayer.create.mockResolvedValue({});

      const result = await gameService.createGame({
        name: 'Test Game',
        rules: 'Standard',
        maxPlayers: 4
      }, 1);

      expect(result).toEqual(mockGame);
      expect(Game.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Game',
        creatorId: 1,
        status: 'waiting'
      }));
      expect(GamePlayer.create).toHaveBeenCalledWith({
        gameId: 1,
        playerId: 1,
        isReady: true
      });
    });
  });

  describe('joinGame', () => {
    test('permite jogador entrar no jogo', async () => {
      const mockGame = { id: 1, status: 'waiting', maxPlayers: 4 };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.count.mockResolvedValue(2);
      GamePlayer.findOne.mockResolvedValue(null);
      GamePlayer.create.mockResolvedValue({});

      const result = await gameService.joinGame(1, 2);

      expect(result).toBe(true);
      expect(GamePlayer.create).toHaveBeenCalledWith({
        gameId: 1,
        playerId: 2,
        isReady: false
      });
    });

    test('lança erro quando jogo está cheio', async () => {
      const mockGame = { id: 1, status: 'waiting', maxPlayers: 4 };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.count.mockResolvedValue(4);

      await expect(gameService.joinGame(1, 2)).rejects.toThrow('O jogo está cheio');
    });

    test('lança erro quando jogador já está no jogo', async () => {
      const mockGame = { id: 1, status: 'waiting', maxPlayers: 4 };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.count.mockResolvedValue(2);
      GamePlayer.findOne.mockResolvedValue({ id: 1, gameId: 1, playerId: 2 });

      await expect(gameService.joinGame(1, 2)).rejects.toThrow('Usuário já está neste jogo');
    });

    test('lança erro quando jogo não está em espera', async () => {
      const mockGame = { id: 1, status: 'started', maxPlayers: 4 };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);

      await expect(gameService.joinGame(1, 2)).rejects.toThrow('Não é possível entrar em um jogo que já iniciou');
    });
  });

  describe('getGameById', () => {
    test('retorna jogo quando encontrado', async () => {
      const mockGame = { id: 1, name: 'Test Game' };
      Game.findByPk.mockResolvedValue(mockGame);

      const result = await gameService.getGameById(1);

      expect(result).toEqual(mockGame);
    });

    test('lança erro quando jogo não encontrado', async () => {
      Game.findByPk.mockResolvedValue(null);

      await expect(gameService.getGameById(999)).rejects.toThrow('Jogo não encontrado');
    });
  });

  describe('toggleReady', () => {
    test('alterna status de pronto do jogador', async () => {
      const mockGame = { id: 1, status: 'waiting' };
      const mockGamePlayer = {
        id: 1,
        isReady: false,
        update: jest.fn().mockResolvedValue({ isReady: true })
      };
      
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.findOne.mockResolvedValue(mockGamePlayer);

      const result = await gameService.toggleReady(1, 2);

      expect(mockGamePlayer.update).toHaveBeenCalledWith({ isReady: true });
      expect(result.isReady).toBe(true);
    });

    test('lança erro quando jogo não está em espera', async () => {
      const mockGame = { id: 1, status: 'started' };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);

      await expect(gameService.toggleReady(1, 2)).rejects.toThrow();
    });
  });

  describe('startGame', () => {
    test('inicia jogo quando há jogadores prontos suficientes', async () => {
      const mockGame = {
        id: 1,
        status: 'waiting',
        creatorId: 1,
        update: jest.fn().mockResolvedValue({ id: 1, status: 'started' })
      };
      const mockPlayers = [
        { playerId: 1, isReady: true, isCurrentTurn: false, update: jest.fn() },
        { playerId: 2, isReady: true, isCurrentTurn: false, update: jest.fn() }
      ];

      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.findAll.mockResolvedValue(mockPlayers);
      GamePlayer.update.mockResolvedValue([1]);

      const result = await gameService.startGame(1, 1);

      expect(mockGame.update).toHaveBeenCalledWith({ status: 'started' });
      expect(result).toBe(true);
    });

    test('lança erro quando chamado por não-criador', async () => {
      const mockGame = { id: 1, status: 'waiting', creatorId: 1 };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);

      await expect(gameService.startGame(1, 2)).rejects.toThrow('Apenas o criador do jogo pode iniciar a partida');
    });

    test('lança erro quando não há jogadores suficientes', async () => {
      const mockGame = { id: 1, status: 'waiting', creatorId: 1 };
      const mockPlayers = [{ playerId: 1, isReady: true }];

      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.findAll.mockResolvedValue(mockPlayers);

      await expect(gameService.startGame(1, 1)).rejects.toThrow('É necessário pelo menos 2 jogadores para iniciar');
    });
  });

  describe('leaveGame', () => {
    test('jogador sai do jogo', async () => {
      const mockGame = { id: 1, status: 'started' };
      const mockGamePlayer = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.findOne.mockResolvedValue(mockGamePlayer);
      GamePlayer.count.mockResolvedValue(3);

      const result = await gameService.leaveGame(1, 2);

      expect(mockGamePlayer.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('endGame', () => {
    test('finaliza jogo quando chamado pelo criador', async () => {
      const mockGame = {
        id: 1,
        status: 'started',
        creatorId: 1,
        update: jest.fn().mockResolvedValue({ status: 'finished' })
      };

      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);

      const result = await gameService.endGame(1, 1);

      expect(mockGame.update).toHaveBeenCalledWith({ status: 'finished' });
    });

    test('lança erro quando não é o criador', async () => {
      const mockGame = { id: 1, status: 'started', creatorId: 1 };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);

      await expect(gameService.endGame(1, 2)).rejects.toThrow('Apenas o criador do jogo pode encerrar a partida');
    });
  });

  describe('getGameState', () => {
    test('retorna estado do jogo', async () => {
      const mockGame = { id: 1, name: 'Test', status: 'started' };
      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);

      const result = await gameService.getGameState(1);

      expect(result).toEqual({ game_id: 1, state: 'started' });
    });
  });

  describe('getGamePlayers', () => {
    test('retorna jogadores do jogo', async () => {
      const mockGame = { id: 1 };
      const mockPlayers = [
        { playerId: 1, Player: { username: 'player1' } },
        { playerId: 2, Player: { username: 'player2' } }
      ];

      jest.spyOn(gameService, 'getGameById').mockResolvedValue(mockGame);
      GamePlayer.findAll.mockResolvedValue(mockPlayers);

      const result = await gameService.getGamePlayers(1);

      expect(result.game_id).toBe(1);
      expect(result.players).toEqual(['player1', 'player2']);
    });
  });

  describe('getCurrentPlayer', () => {
    test('retorna jogador da vez', async () => {
      const mockPlayer = { playerId: 1, Player: { username: 'player1' } };
      
      Game.findByPk.mockResolvedValue({ id: 1 });
      GamePlayer.findOne.mockResolvedValue(mockPlayer);

      const result = await gameService.getCurrentPlayer(1);

      expect(result).toBe('player1');
    });
  });
});
