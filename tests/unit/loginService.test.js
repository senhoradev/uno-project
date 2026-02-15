const loginService = require('../../src/services/loginService');
const Player = require('../../src/models/player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models/player');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('LoginService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('retorna Success com token quando credenciais válidas', async () => {
      const mockPlayer = { id: 1, username: 'testuser', email: 'test@test.com', password: 'hashedpass' };
      Player.findOne.mockResolvedValue(mockPlayer);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-token');

      const result = await loginService.authenticate('testuser', 'password123');

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-token');
    });

    test('retorna Failure quando credenciais inválidas', async () => {
      const mockPlayer = { id: 1, username: 'testuser', password: 'hashedpass' };
      Player.findOne.mockResolvedValue(mockPlayer);
      bcrypt.compare.mockResolvedValue(false);

      await expect(loginService.authenticate('testuser', 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
    });

    test('retorna Failure quando usuário não existe', async () => {
      Player.findOne.mockResolvedValue(null);

      await expect(loginService.authenticate('nonexistent', 'password'))
        .rejects.toThrow('Invalid credentials');
    });

    test('propaga erro de autenticação do playerService', async () => {
      Player.findOne.mockRejectedValue(new Error('Database error'));

      await expect(loginService.authenticate('testuser', 'password'))
        .rejects.toThrow('Database error');
    });
  });

  describe('getProfile', () => {
    test('valida token e retorna perfil do usuário', async () => {
      const mockDecoded = { id: 1, username: 'test', email: 'test@test.com' };
      jwt.verify.mockReturnValue(mockDecoded);

      const result = await loginService.getProfile('valid-token');

      expect(result).toEqual({
        username: 'test',
        email: 'test@test.com'
      });
    });

    test('retorna Failure quando token é inválido', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(loginService.getProfile('invalid-token'))
        .rejects.toThrow('Invalid token');
    });
  });
});
