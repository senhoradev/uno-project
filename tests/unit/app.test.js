const app = require('../../src/app');

describe('App', () => {
  test('app é definido', () => {
    expect(app).toBeDefined();
  });

  test('app tem método listen', () => {
    expect(typeof app.listen).toBe('function');
  });
});
