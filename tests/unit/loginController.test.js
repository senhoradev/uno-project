const loginController = require('../../src/controllers/loginController');
const loginService = require('../../src/services/loginService');

jest.mock('../../src/services/loginService');

describe('LoginController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('retorna token quando login bem-sucedido', async () => {
      loginService.authenticate.mockResolvedValue({ access_token: 'token123' });
      req.body = { username: 'user', password: 'pass' };

      await loginController.login(req, res);

      expect(res.json).toHaveBeenCalledWith({ access_token: 'token123' });
    });

    test('retorna erro quando login falha', async () => {
      loginService.authenticate.mockRejectedValue(new Error('Invalid credentials'));
      req.body = { username: 'user', password: 'wrong' };

      await loginController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });

  describe('logout', () => {
    test('retorna mensagem de logout', async () => {
      await loginController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ 
        message: 'User logged out successfully' 
      });
    });
  });

  describe('profile', () => {
    test('retorna perfil quando token válido', async () => {
      loginService.getProfile.mockResolvedValue({ username: 'test', email: 'test@test.com' });
      req.body = { access_token: 'valid-token' };

      await loginController.profile(req, res);

      expect(res.json).toHaveBeenCalledWith({ username: 'test', email: 'test@test.com' });
    });

    test('retorna erro quando token inválido', async () => {
      loginService.getProfile.mockRejectedValue(new Error('Invalid token'));
      req.body = { access_token: 'invalid' };

      await loginController.profile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });
  });
});
