const request = require('supertest');
const app = require('../../src/app');
const { setupTestDatabase, cleanDatabase, closeDatabase } = require('../helpers/setupModels');

describe('E2E - Fluxo de Autenticação', () => {
  beforeAll(async () => await setupTestDatabase());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => await cleanDatabase());

  test('SignUp -> Login -> Profile -> Logout', async () => {
    const userData = {
      username: 'e2e_user',
      email: 'e2e@test.com',
      password: 'password123',
      name: 'E2E User',
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

  test('SignUp com email duplicado retorna 400', async () => {
    const userA = { username: 'a1', email: 'dup@e2e.com', password: 'password123', name: 'A One', age: 30 };
    await request(app).post('/api/signup').send(userA).expect(201);

    const resp = await request(app).post('/api/signup').send({ username: 'a2', email: 'dup@e2e.com', password: 'password456', name: 'A Two', age: 28 });
    expect(resp.status).toBe(400);
    expect(resp.body).toHaveProperty('error', 'User already exists');
  });
});
