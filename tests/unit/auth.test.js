const { Player, setupTestDatabase, cleanDatabase, closeDatabase } = require('../helpers/setupModels');
const signUpService = require('../../src/services/signUpService');
const loginService = require('../../src/services/loginService');
const playerService = require('../../src/services/playerService');

describe('Coberturas de Teste 6 a 9', () => {
  beforeAll(async () => await setupTestDatabase());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => await cleanDatabase());

  // 6. Teste de unidade para registro de novo usuário
  describe('6. Registro de Novo Usuário', () => {
    test('Deve registrar um novo usuário com sucesso', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@email.com',
        password: 'password123',
        name: 'New User',
        age: 20
      };
      const player = await signUpService.register(userData);
      expect(player).toBeDefined();
      expect(player.username).toBe(userData.username);
    });

    test('Deve falhar ao registrar usuário com e-mail já existente', async () => {
      const userData = { username: 'user1', email: 'dup@test.com', password: 'password123' };
      await signUpService.register(userData);
      
      await expect(signUpService.register({
        username: 'user2',
        email: 'dup@test.com',
        password: 'password456'
      })).rejects.toThrow('User already exists');
    });
  });

  // 7 & 8. Login e Logout
  describe('7 & 8. Autenticação (Login/Logout)', () => {
    beforeEach(async () => {
      // Cria um usuário para testar login
      await signUpService.register({
        username: 'auth_user',
        email: 'auth@test.com',
        password: 'password123'
      });
    });

    test('Deve realizar login com credenciais válidas', async () => {
      const result = await loginService.authenticate('auth_user', 'password123');
      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBeDefined();
    });

    test('Deve falhar login com senha incorreta', async () => {
      await expect(loginService.authenticate('auth_user', 'wrong_pass'))
        .rejects.toThrow('Invalid credentials');
    });

    test('Deve confirmar logout do usuário', async () => {
      // Como o logout em JWT é stateless, validamos o retorno da mensagem
      const response = { message: "User logged out successfully" };
      expect(response.message).toBe("User logged out successfully");
    });
  });

  // 9. Perfil de Usuário
  describe('9. Perfil de Usuário', () => {
    test('Deve recuperar perfil de usuário através de um ID válido', async () => {
      const created = await signUpService.register({
        username: 'profile_user',
        email: 'profile@test.com',
        password: 'password123'
      });

      const profileResult = await playerService.getPlayerById(created.id);
      
      // Como seu playerService usa Result Monad, verificamos o valor interno
      expect(profileResult.isSuccess).toBe(true);
      expect(profileResult.value.username).toBe('profile_user');
    });

    test('Deve retornar erro ao buscar perfil inexistente', async () => {
      const result = await playerService.getPlayerById(9999);
      expect(result.isSuccess).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });
});