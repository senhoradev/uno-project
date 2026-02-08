const { Game, Player, GamePlayer, Card, setupTestDatabase, cleanDatabase, closeDatabase } = require('../helpers/setupModels');
const gameService = require('../../src/services/gameService');
const { getTopCard, getScores, getCurrentPlayer } = require('../../src/services/gameService');

describe('Coberturas de Teste 11 a 19: Fluxo de Jogo UNO', () => {
  let host, guest, game;

  beforeAll(async () => await setupTestDatabase());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => { await cleanDatabase();

  // Criar jogadores e garantir que eles estão salvos
  host = await Player.create({ 
    username: 'host', email: 'h@t.com', password: '123', name: 'H', age: 20 
  });
  guest = await Player.create({ 
    username: 'guest', email: 'g@t.com', password: '123', name: 'G', age: 22 
  });

  // Criar o jogo. O service já fará a vinculação automática do host
  game = await gameService.createGame(
    { name: 'Sala UNO', rules: 'Padrao', maxPlayers: 4 }, 
    host.id
  );
});

  // 11. Ingressar em um jogo
  test('11. Deve permitir entrada de novo jogador', async () => {
    const success = await gameService.joinGame(game.id, guest.id);
    expect(success).toBe(true);
  });

  // 12. Iniciar o jogo
  test('12. Deve iniciar o jogo se todos estiverem prontos', async () => {
    await gameService.joinGame(game.id, guest.id);
    await gameService.toggleReady(game.id, guest.id); // Guest pronto
    // Host já entra pronto por padrão no seu createGame
    const success = await gameService.startGame(game.id, host.id);
    expect(success).toBe(true);
  });

  // 13. Sair do jogo
  test('13. Deve permitir sair e encerrar se restar apenas 1', async () => {
    await gameService.joinGame(game.id, guest.id);
    await gameService.toggleReady(game.id, guest.id);
    await gameService.startGame(game.id, host.id);
    
    await gameService.leaveGame(game.id, guest.id);
    const updated = await Game.findByPk(game.id);
    expect(updated.status).toBe('finished');
  });

  // 14. Finalizar jogo (Manual)
  test('14. Criador deve poder finalizar o jogo', async () => {
    await gameService.joinGame(game.id, guest.id);
    await gameService.toggleReady(game.id, guest.id);
    await gameService.startGame(game.id, host.id);
    
    const success = await gameService.endGame(game.id, host.id);
    expect(success).toBe(true);
  });

  // 15. Estado atual
  test('15. Deve retornar estado do jogo', async () => {
    const state = await gameService.getGameState(game.id);
    expect(state.state).toBe('waiting');
  });

  // 16. Lista de jogadores
  test('16. Deve listar nomes dos jogadores no jogo', async () => {
    await gameService.joinGame(game.id, guest.id);
    const result = await gameService.getGamePlayers(game.id);
    expect(result.players).toContain('host');
    expect(result.players).toContain('guest');
  });

  // 17. Jogador atual (Turno)
  test('17. Deve identificar quem deve jogar', async () => {
    await gameService.joinGame(game.id, guest.id);
    await gameService.toggleReady(game.id, guest.id);
    await gameService.startGame(game.id, host.id);
    
    const currentPlayer = await getCurrentPlayer(game.id);
    expect(currentPlayer).toBe('host');
  });

  // 18. Carta do topo
  test('18. Deve retornar a carta do topo do descarte', async () => {
    await Card.create({ color: 'red', action: '7', gameId: game.id });
    const card = await getTopCard(game.id);
    expect(card.color).toBe('red');
  });

  // 19. Pontuações
  test('19. Deve retornar pontuações de todos os jogadores', async () => {
    await gameService.joinGame(game.id, guest.id);
    const scores = await getScores(game.id);
    expect(scores).toHaveProperty('host', 0);
    expect(scores).toHaveProperty('guest', 0);
  });
});