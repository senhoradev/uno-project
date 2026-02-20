const { Sequelize } = require('sequelize');

describe('Database Config', () => {
  test('database config existe', () => {
    const sequelize = require('../../src/config/database');
    expect(sequelize).toBeInstanceOf(Sequelize);
  });

  test('usa configurações corretas', () => {
    const sequelize = require('../../src/config/database');
    expect(sequelize.config.database).toBeDefined();
  });
});
