const authMiddleware = require('../../src/middlewares/auth');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    test('permite acesso com token válido', () => {
      const mockDecoded = { id: 1, username: 'test', email: 'test@test.com' };
      jwt.verify.mockReturnValue(mockDecoded);
      req.headers.authorization = 'Bearer valid-token';

      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('rejeita requisição sem token', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token is required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejeita token inválido', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      req.headers.authorization = 'Bearer invalid-token';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('rejeita token expirado', () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });
      req.headers.authorization = 'Bearer expired-token';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('aceita token do body access_token', () => {
      const mockDecoded = { id: 1, username: 'test' };
      jwt.verify.mockReturnValue(mockDecoded);
      req.body.access_token = 'token-from-body';

      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalled();
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });
  });
});
