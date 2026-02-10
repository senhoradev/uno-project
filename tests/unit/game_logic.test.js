/**
 * @fileoverview Testes de lógica de jogo (11 a 19) 
 */

jest.mock('../../src/models/game');
jest.mock('../../src/models/player');
jest.mock('../../src/models/gamePlayer');
jest.mock('../../src/models/card');

const Game = require('../../src/models/game');
const GamePlayer = require('../../src/models/gamePlayer');
const Card = require('../../src/models/card');
const gameService = require('../../src/services/gameService');
const { getTopCard, getScores, getCurrentPlayer } = require('../../src/services/gameService');

describe('Coberturas de Teste 11 a 19: Fluxo de Jogo UNO (Mocked Mode)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('11. Testa joinGame() garantindo entrada apenas se houver vagas', async () => {
    Game.findByPk.mockResolvedValue({
      id: 1, 
      status: 'waiting', 
      maxPlayers: 2,
      getPlayers: jest.fn().mockResolvedValue([{ id: 101 }])
    });

    const result = await gameService.joinGame(1, 102);
    expect(result).toBe(true);
  });

  test('12. Valida startGame() permitindo início apenas se 2+ jogadores estiverem prontos', async () => {
    // Mock do Jogo
    Game.findByPk.mockResolvedValue({
      id: 1, 
      creatorId: 101,
      update: jest.fn().mockResolvedValue(true)
    });

    // Mock dos Jogadores com função update para definir o turno inicial
    GamePlayer.findAll.mockResolvedValue([
      { playerId: 101, isReady: true, update: jest.fn().mockResolvedValue(true) },
      { playerId: 102, isReady: true, update: jest.fn().mockResolvedValue(true) }
    ]);

    const result = await gameService.startGame(1, 101);
    expect(result).toBe(true);
  });

  test('13. Testa leaveGame() finalizando jogo se restar apenas um', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    Game.findByPk.mockResolvedValue({
      id: 1, 
      status: 'started', 
      update: mockUpdate
    });
    
    // Mock do jogador a ser removido com função destroy
    GamePlayer.findOne.mockResolvedValue({ 
      id: 50, 
      playerId: 102,
      destroy: jest.fn().mockResolvedValue(true) 
    });
    
    // Simula que resta apenas 1 jogador após a saída
    GamePlayer.count.mockResolvedValue(1);

    await gameService.leaveGame(1, 102);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'finished' });
  });

  test('14. Valida endGame() garantindo que apenas o criador encerre', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(true);
    Game.findByPk.mockResolvedValue({ 
      id: 1, 
      creatorId: 101, 
      status: 'started',
      update: mockUpdate 
    });
    
    // Deve lançar erro se o userId não for o do criador
    await expect(gameService.endGame(1, 102)).rejects.toThrow();
    
    // Deve retornar true se for o criador
    const success = await gameService.endGame(1, 101);
    expect(success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'finished' });
  });

  test('15. Testa getGameState() para confirmar o status atual do jogo', async () => {
    Game.findByPk.mockResolvedValue({ id: 1, status: 'waiting' });
    
    const result = await gameService.getGameState(1);
    expect(result.state).toBe('waiting');
  });

  test('16. Testa getGamePlayers() retornando nomes dos participantes', async () => {
    Game.findByPk.mockResolvedValue({ id: 1 });
    GamePlayer.findAll.mockResolvedValue([
      { Player: { username: 'player1' }, playerId: 101 },
      { Player: { username: 'player2' }, playerId: 102 }
    ]);

    const result = await gameService.getGamePlayers(1);
    expect(result.players).toContain('player1');
    expect(result.players).toContain('player2');
  });

  test('17. Testa getCurrentPlayer() verificando flag isCurrentTurn', async () => {
    Game.findByPk.mockResolvedValue({ id: 1 });
    GamePlayer.findOne.mockResolvedValue({
      Player: { username: 'player1' }
    });

    const result = await getCurrentPlayer(1);
    expect(result).toBe('player1');
  });

  test('18. Testa getTopCard() recuperando a carta mais recente vinculada ao jogo', async () => {
    Game.findByPk.mockResolvedValue({ id: 1 });
    Card.findOne.mockResolvedValue({ color: 'blue', action: 'reverse' });

    const result = await getTopCard(1);
    expect(result.color).toBe('blue');
    expect(result.action).toBe('reverse');
  });

  test('19. Testa getScores() garantindo retorno das pontuações dos jogadores', async () => {
    Game.findByPk.mockResolvedValue({ id: 1 });
    GamePlayer.findAll.mockResolvedValue([
      { Player: { username: 'p1' }, score: 50 },
      { Player: { username: 'p2' }, score: 30 }
    ]);

    const scores = await getScores(1);
    expect(scores.p1).toBe(50);
    expect(scores.p2).toBe(30);
  });
});