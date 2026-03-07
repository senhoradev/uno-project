const request = require('supertest');
const app = require('../../src/app');
const { setupTestDatabase, cleanDatabase, closeDatabase } = require('../helpers/setupModels');

/**
 * E2E Tests para Fluxos Principais do Jogo UNO
 * 
 * Testes que simulam o comportamento real de usuários interagindo com a API
 * incluindo criação de contas, login, gerenciamento de jogos e mecânicas de jogo.
 */

describe('E2E - Fluxo Completo do Jogo UNO', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  /**
   * SUITE 1: AUTENTICAÇÃO DE USUÁRIO
   */
  describe('1. Autenticação de Usuário (SignUp -> Login -> Profile -> Logout)', () => {
    test('Fluxo de Autenticação Completo com Sucesso', async () => {
      const userData = {
        username: 'player1_auth',
        email: 'player1@uno.com',
        password: 'password123',
        name: 'João Silva',
        age: 25
      };

      // SignUp
      const signupRes = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(201);

      expect(signupRes.body).toHaveProperty('message', 'User registered successfully');

      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: userData.username, password: userData.password })
        .expect(200);

      expect(loginRes.body).toHaveProperty('access_token');
      const token = loginRes.body.access_token;

      // Profile
      const profileRes = await request(app)
        .post('/api/auth/profile')
        .send({ access_token: token })
        .expect(200);

      expect(profileRes.body).toHaveProperty('username', userData.username);
      expect(profileRes.body).toHaveProperty('email', userData.email);

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutRes.body).toHaveProperty('message', 'User logged out successfully');
    });

    test('SignUp com email duplicado retorna erro 400', async () => {
      const userA = { 
        username: 'player_dup_a', 
        email: 'duplicate@uno.com', 
        password: 'pass123', 
        name: 'User A', 
        age: 30 
      };

      await request(app).post('/api/signup').send(userA).expect(201);

      const userB = { 
        username: 'player_dup_b', 
        email: 'duplicate@uno.com', 
        password: 'pass456', 
        name: 'User B', 
        age: 28 
      };

      const resp = await request(app).post('/api/signup').send(userB);
      expect(resp.status).toBe(400);
      expect(resp.body).toHaveProperty('error');
    });

    test('Login com credenciais incorretas retorna erro 401', async () => {
      const userData = {
        username: 'player_wrong_pass',
        email: 'wrongpass@uno.com',
        password: 'correctpass123',
        name: 'Test User',
        age: 25
      };

      await request(app).post('/api/signup').send(userData).expect(201);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: userData.username, password: 'wrongpassword' });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body).toHaveProperty('error');
    });
  });

  /**
   * SUITE 2: GERENCIAMENTO DE CARTAS
   */
  describe('2. Gerenciamento de Cartas (CRUD)', () => {
    test('GET /api/cards lista todas as cartas', async () => {
      const res = await request(app)
        .get('/api/cards')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/cards cria uma nova carta', async () => {
      const cardData = {
        color: 'red',
        action: '5',
        gameId: 1
      };

      const res = await request(app)
        .post('/api/cards')
        .send(cardData)
        .expect(201);

      expect(res.body).toHaveProperty('color', 'red');
      expect(res.body).toHaveProperty('action', '5');
    });

    test('GET /api/cards/:id retorna carta específica', async () => {
      const cardData = { color: 'blue', action: '3', gameId: 1 };
      const createRes = await request(app)
        .post('/api/cards')
        .send(cardData)
        .expect(201);

      const cardId = createRes.body.id;

      const getRes = await request(app)
        .get(`/api/cards/${cardId}`)
        .expect(200);

      expect(getRes.body).toHaveProperty('color', 'blue');
    });

    test('PUT /api/cards/:id atualiza carta', async () => {
      const cardData = { color: 'green', action: '7', gameId: 1 };
      const createRes = await request(app)
        .post('/api/cards')
        .send(cardData)
        .expect(201);

      const cardId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/cards/${cardId}`)
        .send({ action: '8' })
        .expect(200);

      expect(updateRes.body).toHaveProperty('action', '8');
    });

    test('DELETE /api/cards/:id remove carta', async () => {
      const cardData = { color: 'yellow', action: '9', gameId: 1 };
      const createRes = await request(app)
        .post('/api/cards')
        .send(cardData)
        .expect(201);

      const cardId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/api/cards/${cardId}`)
        .expect(200);

      expect(deleteRes.body).toHaveProperty('message');

      await request(app)
        .get(`/api/cards/${cardId}`)
        .expect(404);
    });
  });

  /**
   * SUITE 3: GERENCIAMENTO DE JOGADORES
   */
  describe('3. Gerenciamento de Jogadores', () => {
    test('GET /api/players lista todos os jogadores', async () => {
      const res = await request(app)
        .get('/api/players')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  /**
   * SUITE 4: FLUXO SIMPLES DE JOGO
   */
  describe('4. Fluxo de Jogo - Criar e Acessar', () => {
    test('Usuario autenticado pode criar um jogo', async () => {
      const userData = {
        username: 'game_creator',
        email: 'creator@uno.com',
        password: 'pass123',
        name: 'Game Creator',
        age: 25
      };

      await request(app).post('/api/signup').send(userData).expect(201);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: userData.username, password: userData.password })
        .expect(200);

      const token = loginRes.body.access_token;

      const gameData = { name: 'Simple Game', rules: 'Standard UNO Rules' };

      const gameRes = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(gameData)
        .expect(201);

      expect(gameRes.body).toHaveProperty('message', 'Game created successfully');
      expect(gameRes.body).toHaveProperty('game_id');
    });
  });

  /**
   * SUITE 5: HISTÓRICO DE PONTUAÇÃO
   */
  describe('5. Histórico de Pontuação', () => {
    test('GET /api/scoring-history retorna dados', async () => {
      const res = await request(app)
        .get('/api/scoring-history')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  /**
   * SUITE 6: FLUXO COMPLETO
   */
  describe('6. Fluxo Completo: SignUp -> Criar Jogo -> Acessar', () => {
    test('Ciclo completo: Criar usuário, criar jogo e obter estado', async () => {
      const playerData = {
        username: 'complete_flow_player',
        email: 'completeflow@uno.com',
        password: 'password123',
        name: 'Flow Player',
        age: 25
      };

      // SignUp
      const signupRes = await request(app)
        .post('/api/signup')
        .send(playerData)
        .expect(201);

      expect(signupRes.body).toHaveProperty('message');

      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: playerData.username, password: playerData.password })
        .expect(200);

      expect(loginRes.body).toHaveProperty('access_token');
      const token = loginRes.body.access_token;

      // Profile
      const profileRes = await request(app)
        .post('/api/auth/profile')
        .send({ access_token: token })
        .expect(200);

      expect(profileRes.body.username).toBe(playerData.username);

      // Create Game
      const gameData = { name: 'Complete Flow Game', rules: 'Standard' };
      const gameRes = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(gameData)
        .expect(201);

      expect(gameRes.body).toHaveProperty('game_id');
      const gameId = gameRes.body.game_id;

      // Get Game State
      const stateRes = await request(app)
        .post('/api/games/state')
        .set('Authorization', `Bearer ${token}`)
        .send({ game_id: gameId })
        .expect(200);

      expect(stateRes.body).toHaveProperty('game_id');

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutRes.body).toHaveProperty('message');
    });
  });

  /**
   * SUITE 7: TRATAMENTO DE ERROS
   */
  describe('7. Validação e Tratamento de Erros', () => {
    test('POST /api/auth/login com usuario inválido retorna erro', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent_user', password: 'password123' });

      expect([401, 400]).toContain(res.status);
    });

    test('GET /api/players/:id com ID inválido retorna 404', async () => {
      const res = await request(app)
        .get('/api/players/99999');

      expect(res.status).toBe(404);
    });

    test('GET /api/cards/:id com ID inválido retorna 404', async () => {
      const res = await request(app)
        .get('/api/cards/99999');

      expect(res.status).toBe(404);
    });
  });
});
