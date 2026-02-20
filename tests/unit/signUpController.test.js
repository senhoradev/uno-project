const signUpController = require('../../src/controllers/signUpController');
const signUpService = require('../../src/services/signUpService');

jest.mock('../../src/services/signUpService');

describe('SignUpController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('retorna 201 quando registro bem-sucedido', async () => {
      signUpService.register.mockResolvedValue({ id: 1, username: 'newuser', email: 'new@test.com' });
      req.body = { username: 'newuser', email: 'new@test.com', password: 'pass123' };

      await signUpController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
    });

    test('retorna 400 quando registro falha', async () => {
      signUpService.register.mockRejectedValue(new Error('User already exists'));
      req.body = { username: 'user', email: 'exists@test.com', password: 'pass' };

      await signUpController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('retorna 500 quando senha muito curta', async () => {
      signUpService.register.mockRejectedValue(new Error('A senha deve ter pelo menos 6 caracteres'));
      req.body = { username: 'user', email: 'test@test.com', password: '123' };

      await signUpController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
