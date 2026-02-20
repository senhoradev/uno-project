const { Player, setupTestDatabase, cleanDatabase, closeDatabase } = require('../helpers/setupModels'); // Importação necessária
const playerService = require('../../src/services/playerService');

describe('Cobertura 9: Obter Perfil de Usuário', () => {
  beforeAll(async () => await setupTestDatabase());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => await cleanDatabase());

  test('Deve retornar o perfil correto para um ID existente', async () => {
    // Player está definido para a criação manual no banco
    const created = await Player.create({
      username: 'perfil_user',
      email: 'perfil@email.com',
      password: 'hashed_password_123',
      name: 'Perfil Teste',
      age: 30
    });

    const result = await playerService.getPlayerById(created.id);
    
    // Verificação adaptada para Result Monad
    expect(result.isSuccess).toBe(true);
    expect(result.value.username).toBe('perfil_user');
    expect(result.value.email).toBe('perfil@email.com');
  });

  test('Deve retornar um objeto de falha ao buscar perfil de ID inexistente', async () => {
    const result = await playerService.getPlayerById(9999);

    expect(result.isSuccess).toBe(false);
    expect(result.error.message).toBe('Jogador não encontrado');
    expect(result.error.code).toBe('NOT_FOUND');
  });
});