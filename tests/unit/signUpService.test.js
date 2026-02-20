const signUpService = require('../../src/services/signUpService');
const Player = require('../../src/models/player');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// Mocks
jest.mock('../../src/models/player');
jest.mock('bcrypt');

describe('SignUpService - cadastro de usuário', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve criar um novo jogador com sucesso', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue({ id: 1, username: 'testuser' });

    const result = await signUpService.register({
      username: 'testuser',
      email: 'test@email.com',
      password: '123456',
      name: 'Test User',
      age: 20
    });

    expect(Player.findOne).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(Player.create).toHaveBeenCalled();
    expect(result.username).toBe('testuser');
  });

  test('deve lançar erro se a senha tiver menos de 6 caracteres', async () => {
    await expect(
      signUpService.register({
        username: 'test',
        email: 'test@email.com',
        password: '123'
      })
    ).rejects.toThrow('Password must be at least 6 characters long');

    expect(Player.findOne).not.toHaveBeenCalled();
  });

  test('deve lançar erro se o usuário já existir', async () => {
    Player.findOne.mockResolvedValue({ id: 1 });

    await expect(
      signUpService.register({
        username: 'test',
        email: 'test@email.com',
        password: '123456'
      })
    ).rejects.toThrow('User already exists');

    expect(Player.create).not.toHaveBeenCalled();
  });

  test('deve usar o username como nome padrão quando o name não for informado', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue({});

    await signUpService.register({
      username: 'fallbackUser',
      email: 'fallback@email.com',
      password: '123456'
    });

    expect(Player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'fallbackUser'
      })
    );
  });

  test('deve usar idade 0 quando o age não for informado', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue({});

    await signUpService.register({
      username: 'ageUser',
      email: 'age@email.com',
      password: '123456'
    });

    expect(Player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 0
      })
    );
  });

  test('deve buscar usuário existente pelo username ou email', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue({});

    await signUpService.register({
      username: 'testuser',
      email: 'test@email.com',
      password: '123456'
    });

    expect(Player.findOne).toHaveBeenCalledWith({
      where: {
        [Op.or]: [
          { username: 'testuser' },
          { email: 'test@email.com' }
        ]
      }
    });
  });

  test('deve lançar erro se ocorrer falha ao criar no banco de dados', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockRejectedValue(new Error('Database error'));

    await expect(
      signUpService.register({
        username: 'test',
        email: 'test@email.com',
        password: '123456'
      })
    ).rejects.toThrow('Database error');
  });

  test('deve salvar a senha criptografada e não a senha em texto puro', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword123');
    Player.create.mockResolvedValue({});

    await signUpService.register({
      username: 'secureUser',
      email: 'secure@email.com',
      password: '123456'
    });

    expect(Player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'hashedPassword123'
      })
    );
  });

  test('não deve chamar o bcrypt se o usuário já existir', async () => {
    Player.findOne.mockResolvedValue({ id: 1 });

    await expect(
      signUpService.register({
        username: 'existingUser',
        email: 'existing@email.com',
        password: '123456'
      })
    ).rejects.toThrow('User already exists');

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  test('não deve chamar Player.create se a senha for inválida', async () => {
    await expect(
      signUpService.register({
        username: 'test',
        email: 'test@email.com',
        password: '123'
      })
    ).rejects.toThrow();

    expect(Player.create).not.toHaveBeenCalled();
  });

  test('deve retornar exatamente o objeto retornado pelo Player.create', async () => {
    const createdPlayer = {
      id: 99,
      username: 'returnedUser',
      email: 'returned@email.com'
    };

    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue(createdPlayer);

    const result = await signUpService.register({
      username: 'returnedUser',
      email: 'returned@email.com',
      password: '123456'
    });

    expect(result).toBe(createdPlayer);
  });

  test('deve respeitar o nome e a idade informados (sem usar valores padrão)', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue({});

    await signUpService.register({
      username: 'customUser',
      email: 'custom@email.com',
      password: '123456',
      name: 'Custom Name',
      age: 30
    });

    expect(Player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Custom Name',
        age: 30
      })
    );
  });

  test('deve lançar erro se o Player.findOne falhar', async () => {
    Player.findOne.mockRejectedValue(new Error('Database connection error'));

    await expect(
      signUpService.register({
        username: 'test',
        email: 'test@email.com',
        password: '123456'
      })
    ).rejects.toThrow('Database connection error');
  });

  test('deve aceitar senha com exatamente 6 caracteres', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue({});

    await expect(
      signUpService.register({
        username: 'limitUser',
        email: 'limit@email.com',
        password: '123456'
      })
    ).resolves.toBeDefined();
  });

  test('deve enviar username e email corretamente para o Player.create', async () => {
    Player.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    Player.create.mockResolvedValue({});

    await signUpService.register({
      username: 'checkUser',
      email: 'check@email.com',
      password: '123456'
    });

    expect(Player.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'checkUser',
        email: 'check@email.com'
      })
    );
  });

});
