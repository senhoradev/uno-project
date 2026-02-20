describe('PlayerResponseDTO', () => {
  test('cria DTO com username e email', () => {
    const PlayerResponseDTO = require('../../src/DTO/Response/PlayerResponseDTO');
    const dto = new PlayerResponseDTO({ username: 'testuser', email: 'test@test.com' });
    
    expect(dto.username).toBe('testuser');
    expect(dto.email).toBe('test@test.com');
  });

  test('aceita valores vazios', () => {
    const PlayerResponseDTO = require('../../src/DTO/Response/PlayerResponseDTO');
    const dto = new PlayerResponseDTO({ username: '', email: '' });
    
    expect(dto.username).toBe('');
    expect(dto.email).toBe('');
  });
});
