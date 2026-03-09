# Programming 4 - Functional Programming: Course Content Applied to UNO Project

This document details all the content covered in each week of the Programming 4 course and demonstrates how each concept is applied in the UNO game project, with at least 2 examples per topic.

---

## Table of Contents

1. [Week 1 - JavaScript and Node.js Introduction](#week-1---javascript-and-nodejs-introduction)
2. [Week 2 - Functional Programming Principles](#week-2---functional-programming-principles)
3. [Week 3 - Higher-Order Functions](#week-3---higher-order-functions)
4. [Week 4 - Testing in Functional Programming](#week-4---testing-in-functional-programming)
5. [Week 5 - SOLID Principles, Functors and Monads](#week-5---solid-principles-functors-and-monads)
6. [Week 6 - FP Strategies: Recursion, Parallelism, Generators](#week-6---fp-strategies-recursion-parallelism-generators)
7. [Week 7 - Data Processing: Filters, Pipes, Accumulators, Memoization](#week-7---data-processing-filters-pipes-accumulators-memoization)
8. [Week 8 - Mapping Operations: Map, Reduce, Filter, FlatMap, Sort, GroupBy](#week-8---mapping-operations-map-reduce-filter-flatmap-sort-groupby)
9. [Week 9 - FP Conclusions and Other Languages](#week-9---fp-conclusions-and-other-languages)

---

## Week 1 - JavaScript and Node.js Introduction

### 1.1 JavaScript Basics

#### Content Covered:
- Variable declaration (`const`, `let`, `var`)
- Data types (primitives vs objects)
- String manipulation
- Array iteration
- Exception handling
- Object-Oriented Programming with classes
- Asynchronous programming (async/await, Promises)
- Variable scope and Temporal Dead Zone (TDZ)
- Closures
- Type hierarchy and type coercion

#### Application in the Project:

**Example 1: Variable Declaration with `const` and `let`**

In `src/services/playerService.js`:
```javascript
// Using const for immutable bindings (values that won't be reassigned)
const Player = require('../models/player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Using let for mutable bindings in login method
async login(username, password) {
  const player = await Player.findOne({ where: { username } });
  // const is used because player reference won't change
  
  const token = jwt.sign(
    { id: player.id, username: player.username, email: player.email },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '3h' }
  );
  return Result.success({ access_token: token });
}
```

**Example 2: Exception Handling with try-catch**

In `src/services/playerService.js`:
```javascript
async createPlayer(playerToSave) {
  const { email, password, username } = playerToSave;
  
  try {
    if (await playerRepository.existsByEmail(email)) {
      return Result.failure({ message: 'User already exists', code: 'CONFLICT' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const savedPlayer = await playerRepository.save({
      ...playerToSave,
      password: hashedPassword
    });
    return Result.success(new PlayerResponseDTO({ username, email }));
  } catch (error) {
    return Result.failure({ 
      message: 'Erro ao criar jogador no banco de dados', 
      details: error.message, 
      code: 'DATABASE_ERROR' 
    });
  }
}
```

### 1.2 Node.js Fundamentals

#### Content Covered:
- Event-driven architecture
- Asynchronous requests
- Non-blocking I/O
- Express framework
- REPL Terminal

#### Application in the Project:

**Example 1: Event-Driven Architecture with Express**

In `src/app.js`:
```javascript
const express = require('express');
const app = express();

// Event-driven request handling
app.use(express.json());
app.use('/players', playerRoutes);
app.use('/games', gameRoutes);
app.use('/cards', cardRoutes);
```

**Example 2: Asynchronous Database Operations**

In `src/services/gameService.js`:
```javascript
// Asynchronous game creation with automatic player assignment
async createGame(data, creatorId) {
  const game = await Game.create({
    name: data.name,
    rules: data.rules,
    maxPlayers: data.maxPlayers,
    creatorId: creatorId,
    status: 'waiting'
  });

  await GamePlayer.create({
    gameId: game.id,
    playerId: creatorId,
    isReady: true
  });

  return game;
}
```

### 1.3 Object-Oriented Programming in JavaScript

#### Content Covered:
- Class syntax
- Constructor methods
- Inheritance with `extends`
- `this` keyword
- Getters and setters

#### Application in the Project:

**Example 1: Class Definition with Constructor**

In `src/utils/Result.js`:
```javascript
class Result {
  constructor(isSuccess, value, error) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
    Object.freeze(this); // Immutability
  }

  static success(value) {
    return new Result(true, value, null);
  }

  static failure(error) {
    return new Result(false, null, error);
  }
}
```

**Example 2: Service Class Pattern**

In `src/services/playerService.js`:
```javascript
class PlayerService {
  validatePassword(password) {
    if (!password || password.length < 6) {
      return Result.failure({
        message: 'A senha deve ter pelo menos 6 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    return Result.success(password);
  }

  async getPlayerById(id) {
    const player = await playerRepository.findById(id);
    if (!player) {
      return Result.failure({ message: 'Jogador não encontrado', code: 'NOT_FOUND' });
    }
    return Result.success(new PlayerResponseDTO(player));
  }
}

module.exports = new PlayerService();
```

---

## Week 2 - Functional Programming Principles

### 2.1 What is Functional Programming?

#### Content Covered:
- Programming paradigms
- Functional vs Imperative approaches
- Data transformations without mutations
- Focus on "what" instead of "how"

#### Application in the Project:

**Example 1: Declarative Data Transformation**

In `src/services/gameService.js`:
```javascript
// Declarative approach: defining what we want, not how to iterate
async getGamePlayers(gameId) {
  const game = await this.getGameById(gameId);
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{ model: Player, attributes: ['id', 'username'] }]
  });

  // Using map to transform data declaratively
  const players = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
  return { game_id: game.id, players: players };
}
```

**Example 2: Functional Approach to Score Calculation**

In `src/services/gameService.js`:
```javascript
async getScores(gameId) {
  const gamePlayers = await gameRepository.getGameScores(gameId);
  
  // Using forEach in a functional manner to build the scores map
  const scoresMap = {};
  gamePlayers.forEach(gp => {
    const playerName = gp.Player ? gp.Player.name : `Player${gp.playerId}`;
    scoresMap[playerName] = gp.score !== undefined ? gp.score : 0;
  });

  return Result.success({ gameId: gameId, scores: scoresMap });
}
```

### 2.2 Pure Functions vs Impure Functions

#### Content Covered:
- Pure functions: same input always produces same output, no side effects
- Impure functions: may produce side effects, may have different outputs for same input
- Benefits of pure functions: predictability, testability, referential transparency

#### Application in the Project:

**Example 1: Pure Function - Password Validation**

In `src/services/playerService.js`:
```javascript
// PURE FUNCTION: Given the same input, always returns the same output
// No side effects - doesn't modify external state
validatePassword(password) {
  if (!password || password.length < 6) {
    return Result.failure({
      message: 'A senha deve ter pelo menos 6 caracteres',
      code: 'VALIDATION_ERROR'
    });
  }
  return Result.success(password);
}
```

**Example 2: Pure Function - Card Validation Logic**

In `src/services/gameService.js`:
```javascript
// PURE FUNCTION: Determines if a card can be played based on game rules
// Same inputs always produce same outputs
async processCardLogic(cardPlayed, currentIndex, players, direction) {
  const card = cardPlayed.toLowerCase();
  const isSkip = card.includes('skip');
  const isReverse = card.includes('reverse');
  const total = players.length;

  let newDirection = direction;
  if (isReverse) {
    newDirection = direction === "clockwise" ? "counterclockwise" : "clockwise";
  }

  const step = newDirection === "clockwise" ? 1 : -1;
  const normalNextIndex = (currentIndex + step + total) % total;

  let nextPlayerIndex;
  let skippedPlayer = null;

  if (isSkip) {
    skippedPlayer = players[normalNextIndex];
    nextPlayerIndex = (normalNextIndex + step + total) % total;
  } else {
    nextPlayerIndex = normalNextIndex;
  }

  return { newDirection, nextPlayerIndex, nextPlayer: players[nextPlayerIndex], skippedPlayer };
}
```

### 2.3 Immutability

#### Content Covered:
- Objects that cannot be modified after creation
- Object.freeze() for shallow immutability
- Spread operator for creating new objects/arrays
- Benefits: predictability, no side effects, easier debugging

#### Application in the Project:

**Example 1: Immutable Result Object**

In `src/utils/Result.js`:
```javascript
class Result {
  constructor(isSuccess, value, error) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
    Object.freeze(this); // IMMUTABILITY: prevents modification after creation
  }
  
  // Instead of modifying, we create new Result instances
  map(fn) {
    if (this.isSuccess) {
      try {
        return Result.success(fn(this.value)); // Returns NEW Result
      } catch (error) {
        return Result.failure(error);
      }
    }
    return this;
  }
}
```

**Example 2: Immutable Array Operations with Spread Operator**

In `src/services/gameService.js`:
```javascript
// Using spread operator to create new arrays instead of mutating
async drawUntilPlayable(playerHand, deck, currentCard) {
  let newHand = [...playerHand]; // Creates a NEW array (immutable pattern)
  let drawnCard = null;
  let playable = false;

  if (deck.length > 0) {
    drawnCard = deck.shift();
    newHand.push(drawnCard); // Modifies the copy, not the original
    // ... validation logic
  }

  return { newHand, drawnCard, playable };
}

// Also in playCard method:
const newHand = playerHand.filter((_, i) => i !== cardIndex); // Creates NEW array
await currentPlayer.update({ hand: newHand });
```

---

## Week 3 - Higher-Order Functions

### 3.1 Higher-Order Functions

#### Content Covered:
- Functions that receive functions as arguments
- Functions that return functions
- First-class functions
- Abstraction of iteration patterns

#### Application in the Project:

**Example 1: Function Receiving Function as Argument (Callback Pattern)**

In `src/controllers/playerController.js`:
```javascript
// result.fold() is a higher-order function that receives two functions as arguments
exports.create = async (req, res) => {
  try {
    const dto = new CreatePlayerRequestDTO(req.body);
    dto.validate();

    const result = await playerService.createPlayer(dto);

    // fold receives onSuccess and onFailure functions
    return result.fold(
      value => res.status(201).json(new PlayerResponseDTO(value)), // onSuccess callback
      error => sendErrorResponse(res, error) // onFailure callback
    );
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
```

**Example 2: Higher-Order Function Implementation**

In `src/utils/Result.js`:
```javascript
// fold is a higher-order function - receives two functions as parameters
fold(onSuccess, onFailure) {
  return this.isSuccess ? onSuccess(this.value) : onFailure(this.error);
}

// map is also a higher-order function - receives a transformation function
map(fn) {
  if (this.isSuccess) {
    try {
      return Result.success(fn(this.value));
    } catch (error) {
      return Result.failure(error);
    }
  }
  return this;
}
```

### 3.2 Currying

#### Content Covered:
- Transforming a function with multiple arguments into a sequence of functions with single arguments
- Partial application
- Closures maintaining scope

#### Application in the Project:

**Example 1: Curried Error Response Handler**

In `src/controllers/playerController.js`:
```javascript
// Curried function pattern: first receives the status map, then the res, then the error
const sendErrorResponse = (res, error) => {
  const statusMap = {
    VALIDATION_ERROR: 400,
    CONFLICT: 409,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    DATABASE_ERROR: 500,
    AUTH_ERROR: 401
  };

  return res.status(statusMap[error.code] || 400).json({
    error: error.message,
    code: error.code
  });
};

// Could be curried as:
// const sendErrorResponse = statusMap => res => error => res.status(...).json(...)
```

**Example 2: Implicit Currying with Arrow Functions**

In `src/services/gameService.js`:
```javascript
// This pattern demonstrates currying concepts
// The colors.forEach receives a function that implicitly captures 'deck' and 'actions'
createUnoDeck() {
  const deck = [];
  const colors = ['Red', 'Blue', 'Green', 'Yellow'];
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const actions = ['Skip', 'Reverse', 'Draw Two'];

  // forEach uses a curried-like pattern where the callback
  // has access to outer scope (closure)
  colors.forEach(color => {
    deck.push(`${color} 0`);
    
    numbers.slice(1).forEach(number => {
      deck.push(`${color} ${number}`);
      deck.push(`${color} ${number}`);
    });

    actions.forEach(action => {
      deck.push(`${color} ${action}`);
      deck.push(`${color} ${action}`);
    });
  });

  return deck;
}
```

### 3.3 Function Composition

#### Content Covered:
- Combining two or more functions to create a new function
- F(G(x)) - apply G first, then F to the result
- compose and pipe patterns
- reduceRight for composition

#### Application in the Project:

**Example 1: Composition with Result Monad**

In `src/services/playerService.js`:
```javascript
// getProfile demonstrates function composition:
// 1. First decodes the token
// 2. Then gets player by ID
// 3. Then maps (transforms) the result to profile format
async getProfile(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Composition: getPlayerById -> map(transform to profile)
    const playerResult = await this.getPlayerById(decoded.id);
    
    // map composes the transformation on top of the Result
    return playerResult.map(dto => ({
      username: dto.username,
      email: dto.email
    }));
  } catch (error) {
    return Result.failure({ message: 'Invalid token', code: 'UNAUTHORIZED' });
  }
}
```

**Example 2: Composition in Game Flow**

In `src/services/gameService.js`:
```javascript
// playCard demonstrates composition of multiple operations:
// validate game -> validate player turn -> validate card -> process card logic -> update state
async playCard(gameId, playerUsername, cardPlayed, chosenColor = null) {
  // Step 1: Get game (can fail)
  const game = await this.getGameById(gameId);
  if (game.status !== 'started') throw new Error('Jogo não iniciado');

  // Step 2: Get players and validate turn
  const gamePlayers = await GamePlayer.findAll({ where: { gameId }, /* ... */ });
  const playersNames = gamePlayers.map(gp => gp.Player.username);
  
  // Step 3: Validate card in hand (composition of find operations)
  const playerHand = currentPlayer.hand || [];
  const cardIndex = playerHand.findIndex(c => (c.name || c) === cardPlayed);
  if (cardIndex === -1) throw new Error('Carta não encontrada na mão');

  // Step 4: Compose with processCardLogic to determine next state
  const currentDirection = game.direction || 'clockwise';
  const turnResult = await this.processCardLogic(
    cardPlayed, playingPlayerIndex, playersNames, currentDirection
  );

  // Each step builds upon the previous, forming a composition pipeline
  return { message: 'Card played successfully.', /* ... */ };
}
```

---

## Week 4 - Testing in Functional Programming

### 4.1 Differences in Testing Approaches

#### Content Covered:
- Focus on verifying function behavior
- Testing pure functions as black boxes
- Focus on inputs and expected outputs
- Independence from execution order

#### Application in the Project:

**Example 1: Testing Pure Functions as Black Boxes**

In `tests/unit/playerService.monad.test.js`:
```javascript
describe('validatePassword', () => {
  // Pure function tests - same input always produces same output
  test('retorna Success para senha válida', () => {
    const result = playerService.validatePassword('senha123');
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe('senha123');
  });

  test('retorna Failure se senha inválida', () => {
    const result = playerService.validatePassword('123');
    expect(result.isSuccess).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  test('retorna Failure se senha undefined', () => {
    const result = playerService.validatePassword();
    expect(result.isSuccess).toBe(false);
  });
});
```

**Example 2: Order-Independent Tests**

In `tests/unit/playerService.monad.test.js`:
```javascript
describe('getPlayerById', () => {
  // These tests can run in any order because they don't share mutable state
  test('retorna Success quando jogador existe', async () => {
    playerRepository.findById.mockResolvedValue({
      id: 1, username: 'test', email: 'test@test.com'
    });

    const result = await playerService.getPlayerById(1);
    expect(result.isSuccess).toBe(true);
    expect(result.value.username).toBe('test');
  });

  test('retorna Failure quando jogador não existe', async () => {
    playerRepository.findById.mockResolvedValue(null);

    const result = await playerService.getPlayerById(999);
    expect(result.isSuccess).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');
  });

  test('retorna Failure quando banco falha', async () => {
    playerRepository.findById.mockRejectedValue(new Error('DB Error'));

    const result = await playerService.getPlayerById(1);
    expect(result.isSuccess).toBe(false);
    expect(result.error.code).toBe('DATABASE_ERROR');
  });
});
```

### 4.2 Referential Transparency

#### Content Covered:
- An expression can be replaced by its value without changing program results
- Removing dependent external state
- Making state explicit as formal parameters

#### Application in the Project:

**Example 1: Referentially Transparent Password Validation**

In `src/services/playerService.js`:
```javascript
// This function is referentially transparent:
// validatePassword('password123') can always be replaced by its result
validatePassword(password) {
  if (!password || password.length < 6) {
    return Result.failure({
      message: 'A senha deve ter pelo menos 6 caracteres',
      code: 'VALIDATION_ERROR'
    });
  }
  return Result.success(password);
}

// Usage:
const passwordResult = this.validatePassword(password);
// Could be substituted with the result directly in tests
```

**Example 2: Referentially Transparent Card Logic**

In `src/services/gameService.js`:
```javascript
// processCardLogic is referentially transparent:
// Given the same cardPlayed, currentIndex, players, direction
// It ALWAYS returns the same result
async processCardLogic(cardPlayed, currentIndex, players, direction) {
  const card = cardPlayed.toLowerCase();
  const isSkip = card.includes('skip');
  const isReverse = card.includes('reverse');
  const total = players.length;

  let newDirection = direction;
  if (isReverse) {
    newDirection = direction === "clockwise" ? "counterclockwise" : "clockwise";
  }

  const step = newDirection === "clockwise" ? 1 : -1;
  const normalNextIndex = (currentIndex + step + total) % total;

  // ... deterministic calculation
  return { newDirection, nextPlayerIndex, nextPlayer: players[nextPlayerIndex], skippedPlayer };
}

// In tests, we can verify:
// processCardLogic('Red Skip', 0, ['A', 'B', 'C'], 'clockwise')
// will ALWAYS return the same result
```

### 4.3 Mocking External Dependencies

#### Content Covered:
- Simulating external modules
- jest.mock() for module mocking
- mockResolvedValue for async responses
- Isolating pure logic from impure dependencies

#### Application in the Project:

**Example 1: Mocking Repository and External Libraries**

In `tests/unit/playerService.monad.test.js`:
```javascript
// Import and mock all external dependencies
jest.mock('../../src/repository/PlayerRepository');
jest.mock('../../src/models/player');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('login', () => {
  test('retorna Success com token quando credenciais válidas', async () => {
    const mockPlayer = {
      id: 1, username: 'test', email: 'test@test.com', password: 'hashedPassword'
    };

    // Mock external dependencies with controlled responses
    Player.findOne.mockResolvedValue(mockPlayer);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock-jwt-token');

    const result = await playerService.login('test', 'password123');

    expect(result.isSuccess).toBe(true);
    expect(result.value.access_token).toBe('mock-jwt-token');
  });
});
```

**Example 2: Testing Railway-Oriented Programming with Mocks**

In `tests/unit/playerService.monad.test.js`:
```javascript
describe('updatePlayer - Railway-Oriented Programming', () => {
  test('Railway: falha na busca propaga erro', async () => {
    // Mock the "failure rail" scenario
    playerRepository.findById.mockResolvedValue(null);

    const result = await playerService.updatePlayer(999, { username: 'test' });

    // Verify the error propagated through the railway
    expect(result.isSuccess).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');
    // Verify subsequent operations were NOT called (short-circuit)
    expect(playerRepository.update).not.toHaveBeenCalled();
  });

  test('valida e faz hash da nova senha', async () => {
    playerRepository.findById.mockResolvedValue({ id: 1 });
    bcrypt.hash.mockResolvedValue('newHashed');
    playerRepository.update.mockResolvedValue({});

    const result = await playerService.updatePlayer(1, {
      username: 'user', email: 'user@test.com', password: 'newpass123'
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(result.isSuccess).toBe(true);
  });
});
```

---

## Week 5 - SOLID Principles, Functors and Monads

### 5.1 SOLID Principles in Functional Programming

#### Content Covered:
- **S**ingle Responsibility: One reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable
- **I**nterface Segregation: Clients shouldn't depend on unused methods
- **D**ependency Inversion: Depend on abstractions, not concretions

#### Application in the Project:

**Example 1: Single Responsibility Principle**

Each service has a single responsibility:
```javascript
// PlayerService - responsible ONLY for player-related logic
class PlayerService {
  validatePassword(password) { /* ... */ }
  createPlayer(playerToSave) { /* ... */ }
  login(username, password) { /* ... */ }
  getProfile(token) { /* ... */ }
  getPlayerById(id) { /* ... */ }
  updatePlayer(id, data) { /* ... */ }
  deletePlayer(id) { /* ... */ }
}

// GameService - responsible ONLY for game-related logic
class GameService {
  createGame(data, creatorId) { /* ... */ }
  joinGame(gameId, playerId) { /* ... */ }
  startGame(gameId, userId) { /* ... */ }
  playCard(gameId, playerUsername, cardPlayed) { /* ... */ }
}

// CardService - responsible ONLY for card-related logic
class CardService {
  getAllCards(gameId) { /* ... */ }
  createCard(data) { /* ... */ }
  getCardById(id) { /* ... */ }
}
```

**Example 2: Dependency Inversion with Repository Pattern**

In `src/services/playerService.js`:
```javascript
// Service depends on abstraction (Repository interface) not concrete implementation
const playerRepository = require('../repository/PlayerRepository');

class PlayerService {
  async createPlayer(playerToSave) {
    // Depends on repository abstraction, not on concrete Sequelize model
    if (await playerRepository.existsByEmail(email)) {
      return Result.failure({ message: 'User already exists', code: 'CONFLICT' });
    }
    const savedPlayer = await playerRepository.save({ ...playerToSave, password: hashedPassword });
    return Result.success(new PlayerResponseDTO({ username, email }));
  }

  async getPlayerById(id) {
    // Repository can be easily mocked/replaced for testing
    const player = await playerRepository.findById(id);
    if (!player) return Result.failure({ message: 'Jogador não encontrado', code: 'NOT_FOUND' });
    return Result.success(new PlayerResponseDTO(player));
  }
}
```

### 5.2 Functors

#### Content Covered:
- Data structures that can be transformed through a function while preserving structure
- The `map` operation
- Wrapping values in containers
- Operating on values without exposing them directly

#### Application in the Project:

**Example 1: Result as a Functor with map()**

In `src/utils/Result.js`:
```javascript
class Result {
  /**
   * FUNCTOR: map
   * Transforms the internal value if Success, propagates error if Failure
   * 
   * Identity Law: result.map(x => x) === result
   * Composition Law: result.map(f).map(g) === result.map(x => g(f(x)))
   */
  map(fn) {
    if (this.isSuccess) {
      try {
        return Result.success(fn(this.value)); // Transform and wrap in new container
      } catch (error) {
        return Result.failure(error);
      }
    }
    return this; // Preserve structure for failures
  }
}

// Usage in playerService.js:
async getProfile(token) {
  const playerResult = await this.getPlayerById(decoded.id);
  
  // Using Functor map to transform the DTO inside the Result container
  return playerResult.map(dto => ({
    username: dto.username,
    email: dto.email
  }));
}
```

**Example 2: Functor Pattern in Test Verification**

In `tests/unit/playerService.monad.test.js`:
```javascript
describe('getProfile', () => {
  test('usa map (Functor) para transformar DTO', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    playerRepository.findById.mockResolvedValue({
      id: 1, username: 'user', email: 'user@test.com'
    });

    const result = await playerService.getProfile('token');

    // Functor map transformed the DTO, removing 'id' field
    expect(result.value.id).toBeUndefined();
    expect(result.value.username).toBe('user');
  });
});
```

### 5.3 Monads

#### Content Covered:
- Containers with a `flatMap` (bind/chain) function
- Flattening nested structures
- Chaining operations that return wrapped values
- Maybe Monad for null checks
- Either Monad for error handling
- Railway-Oriented Programming

#### Application in the Project:

**Example 1: Result Monad with flatMap**

In `src/utils/Result.js`:
```javascript
class Result {
  /**
   * MONAD: flatMap (also known as bind or chain)
   * Allows chaining operations that return Result, avoiding nested Results
   * 
   * Left Identity: Result.success(a).flatMap(f) === f(a)
   * Right Identity: m.flatMap(Result.success) === m
   * Associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))
   */
  flatMap(fn) {
    if (this.isSuccess) {
      try {
        return fn(this.value); // Returns the Result from fn, not wrapped again
      } catch (error) {
        return Result.failure(error);
      }
    }
    return this;
  }
}
```

**Example 2: Railway-Oriented Programming with flatMap**

In `src/services/playerService.js`:
```javascript
/**
 * Updates player data using flatMap (Monad Composition)
 * Demonstrates Railway-Oriented Programming: if search fails, update is not attempted
 */
async updatePlayer(id, data) {
  // 1. Start the "rail" by searching for the player
  const playerResult = await this.getPlayerById(id);

  // 2. Use flatMap to chain the update logic only if player exists
  return playerResult.flatMap(async () => {
    try {
      // Optional password validation
      if (data.password) {
        const passValid = this.validatePassword(data.password);
        if (passValid.isErr()) return passValid; // Short-circuit on validation failure
        data.password = await bcrypt.hash(data.password, 10);
      }

      const updated = await playerRepository.update(id, data);
      return Result.success(new PlayerResponseDTO({ username: data.username, email: data.email }));
    } catch (error) {
      return Result.failure({ message: 'Erro ao atualizar', code: 'DATABASE_ERROR' });
    }
  });
}

/**
 * Removes a player using Monad composition
 */
async deletePlayer(id) {
  // Composition: Search -> If Success -> Delete
  const playerResult = await this.getPlayerById(id);

  return playerResult.flatMap(async () => {
    try {
      await playerRepository.deleteById(id);
      return Result.success({ message: 'Jogador removido com sucesso', id: id });
    } catch (error) {
      return Result.failure({ message: 'Erro ao remover jogador', code: 'DATABASE_ERROR' });
    }
  });
}
```

---

## Week 6 - FP Strategies: Recursion, Parallelism, Generators

### 6.1 Recursion

#### Content Covered:
- Technique for solving problems by dividing into smaller problems
- Base case(s) to stop recursion
- Recursive case(s) that call the function itself
- Recursively defined data structures (trees, nodes)

#### Application in the Project:

**Example 1: Recursive Card Distribution (Round-Robin)**

In `src/services/gameService.js`:
```javascript
/**
 * Distributes cards to players in circular fashion (Round-Robin) using recursion.
 * @param {string[]} players - List of player names
 * @param {number} cards - Total cards to distribute per player
 * @param {string[]} deck - Current deck
 * @param {Object} hands - Accumulator for hands
 * @param {number} pIdx - Current player index
 * @param {number} round - Cards distributed per player counter
 * @returns {Object} Map with player hands
 */
dealCardsRecursive(players, cards, deck, hands = {}, pIdx = 0, round = 0) {
  // BASE CASE: if reached the number of cards per player, stop recursion
  if (round >= cards) return hands;

  const p = players[pIdx];

  // Initialize player's hand if doesn't exist
  if (!hands[p]) hands[p] = [];

  // Draw a card from deck and give to current player
  if (deck.length > 0) {
    hands[p].push(deck.pop());
  }

  // Calculate next player and check if completed a distribution round
  const nextP = (pIdx + 1) % players.length;
  const nextRound = nextP === 0 ? round + 1 : round;

  // RECURSIVE CASE: call itself with updated state
  return this.dealCardsRecursive(players, cards, deck, hands, nextP, nextRound);
}
```

**Example 2: Recursive Valid Card Search with Generator**

In `src/services/gameService.js`:
```javascript
/**
 * Identifies playable cards using recursive Generator Function.
 * Processes hand item by item lazily.
 * 
 * @param {string[]} hand - Player's hand
 * @param {string} topCard - Top card on discard pile
 * @param {string} currentColor - Current game color
 * @param {number} index - Current iteration index
 * @yields {string} Next valid card found
 */
*findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
  // BASE CASE: end of array
  if (index >= hand.length) return;

  const card = hand[index];
  const cardName = (card.name || card).toString();
  const topCardName = (topCard.name || topCard).toString();
  const topParts = topCardName.split(' ');
  const cardParts = cardName.split(' ');

  // Validation rules
  const isWild = cardParts[0] === 'Wild';
  const sameColor = cardParts[0] === (currentColor || topParts[0]);
  const sameValue = cardParts[1] && cardParts[1] === topParts[1];

  if (isWild || sameColor || sameValue) {
    yield card;
  }

  // RECURSIVE CASE: yield* delegates to next generator call
  yield* this.findValidCardsRecursive(hand, topCard, currentColor, index + 1);
}
```

### 6.2 Parallelism and Concurrency

#### Content Covered:
- Parallelism: Executing multiple tasks simultaneously on multiple CPU cores
- Concurrency: Handling multiple tasks simultaneously (not necessarily at same time)
- Promise.all for concurrent execution
- async/await for asynchronous flow

#### Application in the Project:

**Example 1: Concurrent Database Operations**

In `src/services/gameService.js`:
```javascript
async dealCards(gameId, cardsPerPlayer = 7) {
  const game = await this.getGameById(gameId);
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{ model: Player, attributes: ['id', 'username'] }]
  });

  // Multiple concurrent operations could be used here:
  // await Promise.all([
  //   Card.destroy({ where: { gameId } }),
  //   Card.bulkCreate(cardDataArray),
  //   ...gamePlayers.map(gp => gp.update({ hand: playerHands[name] || [] }))
  // ]);

  // Sequential updates to player hands
  for (const gamePlayer of gamePlayers) {
    const name = gamePlayer.Player ? gamePlayer.Player.username : `Player${gamePlayer.playerId}`;
    await gamePlayer.update({ hand: playerHands[name] || [] });
  }

  return { message: 'Cards dealt successfully.', players: playerHands, firstCard };
}
```

**Example 2: Concurrent Validations**

In `src/services/gameService.js`:
```javascript
async startGame(gameId, userId) {
  // Concurrent data fetching could be applied:
  // const [game, players] = await Promise.all([
  //   this.getGameById(gameId),
  //   GamePlayer.findAll({ where: { gameId } })
  // ]);

  const game = await this.getGameById(gameId);
  if (game.creatorId !== userId) {
    throw new Error('Apenas o criador do jogo pode iniciar a partida');
  }

  const players = await GamePlayer.findAll({ where: { gameId } });
  if (players.length < 2) {
    throw new Error('É necessário pelo menos 2 jogadores para iniciar');
  }

  // Using every() - a functional approach to check all players are ready
  const allReady = players.every(p => p.isReady === true);
  if (!allReady) {
    throw new Error('Nem todos os jogadores estão prontos');
  }

  await game.update({ status: 'started' });
  return true;
}
```

### 6.3 Generators

#### Content Covered:
- Special functions that can pause execution and continue from where they stopped
- `function*` syntax
- `yield` keyword for producing values
- Lazy evaluation (values generated on demand)
- Infinite sequences

#### Application in the Project:

**Example 1: Generator for Finding Valid Cards**

In `src/services/gameService.js`:
```javascript
/**
 * Generator Function for lazy evaluation of valid cards.
 * Only processes cards until a valid one is found (on-demand).
 */
*findValidCardsRecursive(hand, topCard, currentColor, index = 0) {
  if (index >= hand.length) return;

  const card = hand[index];
  const cardName = (card.name || card).toString();
  const topCardName = (topCard.name || topCard).toString();
  const topParts = topCardName.split(' ');
  const cardParts = cardName.split(' ');

  const isWild = cardParts[0] === 'Wild';
  const sameColor = cardParts[0] === (currentColor || topParts[0]);
  const sameValue = cardParts[1] && cardParts[1] === topParts[1];

  if (isWild || sameColor || sameValue) {
    yield card; // Pauses here and returns card
  }

  yield* this.findValidCardsRecursive(hand, topCard, currentColor, index + 1);
}

// Usage example:
// const validCardsGenerator = gameService.findValidCardsRecursive(playerHand, topCard, currentColor);
// const firstValidCard = validCardsGenerator.next().value; // Gets only first valid card lazily
```

**Example 2: Conceptual Generator for Deck Iteration**

```javascript
// Conceptual implementation showing how generators could be used for deck operations
function* deckIterator(deck) {
  for (let i = 0; i < deck.length; i++) {
    yield { card: deck[i], index: i, remaining: deck.length - i - 1 };
  }
}

// Usage:
// const iterator = deckIterator(shuffledDeck);
// for (const { card, index, remaining } of iterator) {
//   if (shouldStop(card)) break; // Lazy - stops when condition met
//   processCard(card);
// }
```

---

## Week 7 - Data Processing: Filters, Pipes, Accumulators, Memoization

### 7.1 Pipes

#### Content Covered:
- Combining sequential operations
- Using reduce to chain functions
- lodash/fp pipe implementation
- Creating clear and modular data flows

#### Application in the Project:

**Example 1: Conceptual Pipe Implementation for Card Processing**

```javascript
// Pipe pattern that could be applied in the project
const pipe = (...fns) => input => fns.reduce((acc, fn) => fn(acc), input);

// In gameService, processing a played card could be expressed as:
const processPlayedCard = pipe(
  validateCardInHand,
  validateCardMatchesTop,
  removeFromHand,
  addToDiscardPile,
  calculateNextPlayer,
  updateGameState
);

// Current implementation uses sequential steps (imperative),
// but follows the pipe concept:
async playCard(gameId, playerUsername, cardPlayed, chosenColor = null) {
  // Step 1: Validate game state
  const game = await this.getGameById(gameId);
  // Step 2: Validate player turn
  const currentPlayer = gamePlayers[playingPlayerIndex];
  // Step 3: Validate card in hand
  const cardIndex = playerHand.findIndex(c => (c.name || c) === cardPlayed);
  // Step 4: Process card logic
  const turnResult = await this.processCardLogic(...);
  // Step 5: Update state
  await game.update(updateData);
  // Each step transforms and passes to the next
}
```

**Example 2: Pipe Pattern in Controller Response Handling**

In `src/controllers/playerController.js`:
```javascript
// The fold method acts like a pipe endpoint, directing flow based on result
exports.getById = async (req, res) => {
  const result = await playerService.getPlayerById(req.params.id);

  // fold pipes the result to either success or failure handler
  return result.fold(
    value => res.json(new PlayerResponseDTO(value)),
    error => sendErrorResponse(res, error)
  );
};

// This is equivalent to:
// pipe(
//   getPlayerById,
//   foldResult(
//     success => res.json(new DTO(success)),
//     failure => sendError(failure)
//   )
// )(req.params.id)
```

### 7.2 Filters

#### Content Covered:
- Selecting elements from a collection using predicates
- Array.prototype.filter
- Custom filter implementations
- Lodash filter with objects

#### Application in the Project:

**Example 1: Filtering Cards by Game**

In `src/services/cardService.js`:
```javascript
async getAllCards(gameId) {
  if (gameId) {
    // Filter cards belonging to a specific game
    return await Card.findAll({ where: { gameId } });
  }
  return await Card.findAll();
}
```

**Example 2: Filtering Players and Valid Cards**

In `src/services/gameService.js`:
```javascript
// Filter to remove played card from hand (creates new array)
const newHand = playerHand.filter((_, i) => i !== cardIndex);
await currentPlayer.update({ hand: newHand });

// Filter to find players matching criteria
async getGamePlayers(gameId) {
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{ model: Player, attributes: ['id', 'username'] }]
  });

  // Using map with implicit filtering (only returns valid usernames)
  const players = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
  return { game_id: game.id, players: players };
}
```

### 7.3 Accumulators

#### Content Covered:
- Performing iterative operations using reduce
- Building up results incrementally
- Custom accumulator implementations
- Relationship between accumulators and reduce

#### Application in the Project:

**Example 1: Accumulator for Building Scores Map**

In `src/services/gameService.js`:
```javascript
async getScores(gameId) {
  const gamePlayers = await gameRepository.getGameScores(gameId);

  // Accumulator pattern: building scoresMap incrementally
  const scoresMap = {};
  gamePlayers.forEach(gp => {
    const playerName = gp.Player ? gp.Player.name : `Player${gp.playerId}`;
    scoresMap[playerName] = gp.score !== undefined ? gp.score : 0;
  });

  // Could be written with reduce:
  // const scoresMap = gamePlayers.reduce((acc, gp) => {
  //   const playerName = gp.Player ? gp.Player.name : `Player${gp.playerId}`;
  //   acc[playerName] = gp.score !== undefined ? gp.score : 0;
  //   return acc;
  // }, {});

  return Result.success({ gameId: gameId, scores: scoresMap });
}
```

**Example 2: Accumulator in Recursive Card Distribution**

In `src/services/gameService.js`:
```javascript
// hands parameter acts as an accumulator across recursive calls
dealCardsRecursive(players, cards, deck, hands = {}, pIdx = 0, round = 0) {
  if (round >= cards) return hands; // Return accumulated result

  const p = players[pIdx];

  // Initialize accumulator entry if doesn't exist
  if (!hands[p]) hands[p] = [];

  // Accumulate cards into player's hand
  if (deck.length > 0) {
    hands[p].push(deck.pop());
  }

  const nextP = (pIdx + 1) % players.length;
  const nextRound = nextP === 0 ? round + 1 : round;

  // Pass accumulator to next recursive call
  return this.dealCardsRecursive(players, cards, deck, hands, nextP, nextRound);
}
```

### 7.4 Memoization

#### Content Covered:
- Caching results of expensive function calls
- Avoiding recomputation for same inputs
- Custom memoization implementation
- Lodash memoize

#### Application in the Project:

**Example 1: Conceptual Memoization for Deck Creation**

```javascript
// Memoization could be applied to expensive operations like deck creation
import memoize from 'lodash';

// The UNO deck is always the same, so it can be memoized
const memoizedCreateUnoDeck = _.memoize(function createUnoDeck() {
  const deck = [];
  const colors = ['Red', 'Blue', 'Green', 'Yellow'];
  // ... deck creation logic
  return deck;
});

// First call: computes the deck
const deck1 = memoizedCreateUnoDeck(); // Computing...

// Second call: returns cached result
const deck2 = memoizedCreateUnoDeck(); // Instant (from cache)
```

**Example 2: Memoization Pattern in Result.fromPromise**

In `src/utils/Result.js`:
```javascript
// This static method could benefit from memoization for repeated API calls
static async fromPromise(promise) {
  try {
    const value = await promise;
    return Result.success(value);
  } catch (error) {
    return Result.failure(error);
  }
}

// With memoization (conceptual):
// const memoizedFromPromise = memoize(async (promiseFactory, key) => {
//   return Result.fromPromise(promiseFactory());
// });
//
// Usage: memoizedFromPromise(() => fetch('/api/user/1'), 'user-1');
```

---

## Week 8 - Mapping Operations: Map, Reduce, Filter, FlatMap, Sort, GroupBy

### 8.1 Filter, Map, Reduce

#### Content Covered:
- **Filter**: Creates new array with elements passing a test
- **Map**: Creates new array by transforming each element
- **Reduce**: Reduces array to single value using accumulator
- Chaining these operations

#### Application in the Project:

**Example 1: Map for Data Transformation**

In `src/services/gameService.js`:
```javascript
// Map to transform gamePlayers to player names
async getGamePlayers(gameId) {
  const gamePlayers = await GamePlayer.findAll({
    where: { gameId },
    include: [{ model: Player, attributes: ['id', 'username'] }]
  });

  // MAP: Transform each gamePlayer object to just the username string
  const players = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
  return { game_id: game.id, players: players };
}

// Map for deck creation
const cardDataArray = deckStrings.map(name => {
  const parts = name.split(' ');
  const color = parts[0];
  const action = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
  return { color, action, gameId };
});
```

**Example 2: Filter with Functional Predicate**

In `src/services/gameService.js`:
```javascript
// Filter to remove a specific card from hand
const newHand = playerHand.filter((_, i) => i !== cardIndex);

// Filter could be used for finding valid cards:
// const validCards = playerHand.filter(card => {
//   const cardName = card.name || card;
//   return isWild(cardName) || matchesColor(cardName) || matchesValue(cardName);
// });
```

### 8.2 Some, Every, Find

#### Content Covered:
- **Some**: Returns true if at least one element passes test
- **Every**: Returns true if all elements pass test
- **Find**: Returns first element that passes test
- **FindIndex**: Returns index of first matching element

#### Application in the Project:

**Example 1: Every for All Players Ready Check**

In `src/services/gameService.js`:
```javascript
async startGame(gameId, userId) {
  const players = await GamePlayer.findAll({ where: { gameId } });
  
  // EVERY: Check if ALL players are ready (all must pass the test)
  const allReady = players.every(p => p.isReady === true);
  if (!allReady) {
    throw new Error('Nem todos os jogadores estão prontos');
  }

  await game.update({ status: 'started' });
  return true;
}
```

**Example 2: Find and FindIndex for Player/Card Location**

In `src/services/gameService.js`:
```javascript
// FIND: Get current player with turn
async getCurrentPlayer(gameId) {
  const gamePlayer = await GamePlayer.findOne({
    where: { gameId, isCurrentTurn: true },
    include: [{ model: Player, attributes: ['username'] }]
  });
  if (!gamePlayer || !gamePlayer.Player) throw new Error('Nenhum jogador atual');
  return gamePlayer.Player.username;
}

// FINDINDEX: Find position of card in hand
async playCard(gameId, playerUsername, cardPlayed) {
  const playerHand = currentPlayer.hand || [];
  
  // FindIndex to locate the card's position
  const cardIndex = playerHand.findIndex(c => {
    const cardName = c.name || c;
    return cardName === cardPlayed;
  });
  
  if (cardIndex === -1) throw new Error('Carta não encontrada na mão');
  // ...
}

// FindIndex to find current turn index
async getLiveGameContext(gameId) {
  const gamePlayers = await GamePlayer.findAll({ where: { gameId } });
  
  // FindIndex to get index of player with current turn
  const currentIndex = gamePlayers.findIndex(gp => gp.isCurrentTurn === true);
  if (currentIndex === -1) throw new Error('Turno atual não configurado');
  
  return { game, gamePlayers, playersNames, currentIndex };
}
```

### 8.3 FlatMap, Sort, GroupBy, Partition, Zip, Chunk

#### Content Covered:
- **FlatMap**: Map then flatten results
- **Sort**: Order elements
- **GroupBy**: Group elements by criteria (Lodash)
- **Partition**: Split into two groups (Lodash)
- **Zip**: Combine arrays element-wise (Lodash)
- **Chunk**: Split array into smaller arrays (Lodash)

#### Application in the Project:

**Example 1: FlatMap Pattern in Result Monad**

In `src/utils/Result.js`:
```javascript
// flatMap IS our FlatMap implementation
// It maps and then "flattens" by not double-wrapping the Result
flatMap(fn) {
  if (this.isSuccess) {
    try {
      return fn(this.value); // Returns Result directly (flattened)
    } catch (error) {
      return Result.failure(error);
    }
  }
  return this;
}

// Without flatMap, we'd get nested Results: Result<Result<T>>
// With flatMap, we get: Result<T>
```

**Example 2: Sort for Game Player Ordering**

In `src/services/gameService.js`:
```javascript
// Sorting by ID to maintain consistent player order
const gamePlayers = await GamePlayer.findAll({
  where: { gameId },
  include: [{ model: Player, attributes: ['username', 'id'] }],
  order: [['id', 'ASC']] // SORT: Maintains entry order of players
});

// Conceptual GroupBy for score categories:
// const scoreGroups = _.groupBy(gamePlayers, gp => {
//   if (gp.score >= 100) return 'high';
//   if (gp.score >= 50) return 'medium';
//   return 'low';
// });
// Result: { high: [...], medium: [...], low: [...] }
```

---

## Week 9 - FP Conclusions and Other Languages

### 9.1 Advantages of Functional Programming

#### Content Covered:
- Cleaner, simpler, smaller code
- Modularity (divide problems into smaller instances)
- Reusability (shared auxiliary functions)
- Reduced coupling (pure functions are independent)
- Easier testing and debugging
- Predictability through immutability

#### Application in the Project:

**Example 1: Modular Result Pattern**

In `src/utils/Result.js`:
```javascript
// The Result class is highly reusable across the entire project
// It provides a consistent way to handle success/failure in any service

// Used in PlayerService
async createPlayer(playerToSave) {
  return Result.success(new PlayerResponseDTO({ username, email }));
}

// Used in GameService
async getScores(gameId) {
  return Result.success({ gameId: gameId, scores: scoresMap });
}

// Reusable error handling in any controller
return result.fold(
  value => res.status(201).json(value),
  error => sendErrorResponse(res, error)
);
```

**Example 2: Reduced Coupling Through Pure Functions**

In `src/services/gameService.js`:
```javascript
// processCardLogic is completely independent - no external state dependency
// It can be tested in isolation and reused anywhere
async processCardLogic(cardPlayed, currentIndex, players, direction) {
  const card = cardPlayed.toLowerCase();
  const isSkip = card.includes('skip');
  const isReverse = card.includes('reverse');
  const total = players.length;

  // All state is received as parameters, not read from external sources
  let newDirection = direction;
  if (isReverse) {
    newDirection = direction === "clockwise" ? "counterclockwise" : "clockwise";
  }

  // Pure calculation, easily testable
  const step = newDirection === "clockwise" ? 1 : -1;
  const normalNextIndex = (currentIndex + step + total) % total;

  return { newDirection, nextPlayerIndex, nextPlayer: players[nextPlayerIndex], skippedPlayer };
}
```

### 9.2 Other Functional Languages (Haskell)

#### Content Covered:
- Haskell as a purely functional language
- Immutability by default
- First-class functions
- Type system
- Comparison with JavaScript

#### Application in the Project:

**Example 1: Haskell-Inspired Type Annotations (JSDoc)**

In `src/services/gameService.js`:
```javascript
/**
 * Distributes cards to players in circular fashion using recursion.
 * 
 * Haskell equivalent signature would be:
 * dealCardsRecursive :: [String] -> Int -> [Card] -> Map String [Card] -> Int -> Int -> Map String [Card]
 * 
 * @param {string[]} players - List of player names
 * @param {number} cards - Total cards to distribute per player
 * @param {string[]} deck - Current deck
 * @param {Object} hands - Accumulator for hands (Map String [Card])
 * @param {number} pIdx - Current player index
 * @param {number} round - Cards distributed per player counter
 * @returns {Object} Map with player hands
 */
dealCardsRecursive(players, cards, deck, hands = {}, pIdx = 0, round = 0) {
  // Base case: if round >= cards return hands
  // Recursive case: distribute one card and recurse
}
```

**Example 2: Haskell-Like Pattern Matching with Result**

In `src/utils/Result.js`:
```javascript
/**
 * Pattern matching - executes a function based on state
 * 
 * Haskell equivalent:
 * fold :: Result a e -> (a -> b) -> (e -> b) -> b
 * fold (Success a) onSuccess onFailure = onSuccess a
 * fold (Failure e) onSuccess onFailure = onFailure e
 */
fold(onSuccess, onFailure) {
  return this.isSuccess ? onSuccess(this.value) : onFailure(this.error);
}

// Usage mirrors Haskell pattern matching:
result.fold(
  value => handleSuccess(value),  // Success case
  error => handleError(error)     // Failure case
);
```

### 9.3 KISS Principle (Keep It Simple, Stupid)

#### Application in the Project:

**Example 1: Simple Password Validation**

In `src/services/playerService.js`:
```javascript
// KISS: Simple, direct validation without over-engineering
validatePassword(password) {
  if (!password || password.length < 6) {
    return Result.failure({
      message: 'A senha deve ter pelo menos 6 caracteres',
      code: 'VALIDATION_ERROR'
    });
  }
  return Result.success(password);
}
```

**Example 2: Simple Card Match Validation**

In `src/services/gameService.js`:
```javascript
// KISS: Clear, simple conditions for card validation
if (!isWild && topCardName) {
  const cardParts = cardPlayed.split(' ');
  const topParts = topCardName.split(' ');
  const activeColor = (game.currentColor || topParts[0]).toLowerCase();
  const sameColor = cardParts[0].toLowerCase() === activeColor;
  const sameValue = cardParts.slice(1).join(' ') === topParts.slice(1).join(' ');

  // Simple, readable condition
  if (!sameColor && !sameValue) {
    throw new Error('Invalid card. Please play a card that matches the top card.');
  }
}
```

---

## Summary Table: Course Concepts vs Project Implementation

| Week | Concept | Project File | Implementation |
|------|---------|--------------|----------------|
| 1 | const/let variables | All files | Variable declarations throughout |
| 1 | try-catch | playerService.js | Error handling in all service methods |
| 1 | async/await | All services | Asynchronous database operations |
| 1 | Classes | Result.js, Services | OOP structure for services and utilities |
| 2 | Pure Functions | playerService.js | validatePassword() |
| 2 | Immutability | Result.js | Object.freeze(), spread operator |
| 2 | Impure Functions | gameService.js | Database operations (necessary side effects) |
| 3 | Higher-Order Functions | Result.js | map(), flatMap(), fold() |
| 3 | Currying | Controllers | sendErrorResponse pattern |
| 3 | Composition | playerService.js | getProfile() with map transformation |
| 4 | Unit Testing | tests/unit/*.test.js | Jest test suites |
| 4 | Referential Transparency | playerService.js | validatePassword(), processCardLogic() |
| 4 | Mocking | *.test.js | jest.mock() for repositories |
| 5 | Single Responsibility | All Services | One service per domain |
| 5 | Dependency Inversion | playerService.js | Repository abstraction |
| 5 | Functors | Result.js | map() implementation |
| 5 | Monads | Result.js | flatMap() implementation |
| 6 | Recursion | gameService.js | dealCardsRecursive() |
| 6 | Generators | gameService.js | *findValidCardsRecursive() |
| 6 | Concurrency | gameService.js | Promise-based operations |
| 7 | Filters | gameService.js | Array.filter() for hand manipulation |
| 7 | Pipes | Controllers | fold() as pipe endpoint |
| 7 | Accumulators | gameService.js | getScores(), dealCardsRecursive() |
| 8 | Map | gameService.js | Data transformations |
| 8 | Every | gameService.js | startGame() all players ready check |
| 8 | Find/FindIndex | gameService.js | Card and player location |
| 8 | FlatMap | Result.js | Monad bind operation |
| 9 | KISS | All files | Simple, clear implementations |
| 9 | Modularity | Project structure | Services, Controllers, Repositories |

---

## Conclusion

This UNO project demonstrates a comprehensive application of Functional Programming principles learned throughout the Programming 4 course. The Result Monad pattern serves as the backbone for error handling, implementing Functor (map) and Monad (flatMap) concepts. Pure functions ensure predictability in game logic, while higher-order functions enable flexible composition. Recursion is elegantly applied in card distribution, and generators provide lazy evaluation for valid card searches. The project structure follows SOLID principles with clear separation of concerns across services, controllers, and repositories.
