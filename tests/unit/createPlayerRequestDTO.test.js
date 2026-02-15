const CreatePlayerRequestDTO = require('../../src/DTO/Request/Player/CreatePlayerRequestDTO');

describe('CreatePlayerRequestDTO', () => {
  test('cria DTO com todos os campos', () => {
    const data = {
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      age: 25,
      name: 'Test User'
    };
    
    const dto = new CreatePlayerRequestDTO(data);
    
    expect(dto.username).toBe('testuser');
    expect(dto.email).toBe('test@test.com');
    expect(dto.password).toBe('password123');
  });

  test('usa valores padrão quando campos opcionais ausentes', () => {
    const data = {
      username: 'user',
      email: 'user@test.com',
      password: 'pass123'
    };
    
    const dto = new CreatePlayerRequestDTO(data);
    
    expect(dto.username).toBe('user');
    expect(dto.email).toBe('user@test.com');
  });

  test('aceita objeto vazio', () => {
    const dto = new CreatePlayerRequestDTO({});
    
    expect(dto).toBeDefined();
  });
});
