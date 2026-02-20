const sequelize = require('../../src/config/database');
const GamePlayer = require('../../src/models/gamePlayer');

describe('GamePlayer Model', () => {
  test('model está definido', () => {
    expect(GamePlayer).toBeDefined();
  });

  test('possui campos gameId e playerId', () => {
    expect(GamePlayer.rawAttributes).toHaveProperty('gameId');
    expect(GamePlayer.rawAttributes).toHaveProperty('playerId');
  });

  test('possui campo isReady', () => {
    expect(GamePlayer.rawAttributes).toHaveProperty('isReady');
  });

  test('possui campo isCurrentTurn', () => {
    expect(GamePlayer.rawAttributes).toHaveProperty('isCurrentTurn');
  });

  test('isReady tem valor padrão false', () => {
    expect(GamePlayer.rawAttributes.isReady.defaultValue).toBe(false);
  });
});
