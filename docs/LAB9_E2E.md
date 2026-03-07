# LAB 9 - Testes End-to-End para Capstone UNO

## 1. Fluxos Principais Identificados

| # | Fluxo | Endpoints | Testes |
|---|-------|-----------|--------|
| 1 | Autenticação | POST /signup, POST /login, POST /profile, POST /logout | 3 |
| 2 | Gerenciamento Cartas (CRUD) | GET/POST/PUT/DELETE /cards | 5 |
| 3 | Gerenciamento Jogadores | GET /players | 1 |
| 4 | Criar Jogo | POST /games, POST /games/state | 1 |
| 5 | Histórico Pontuação | GET /scoring-history | 1 |
| **6** | **Fluxo E2E Completo** | SignUp→Login→CreateGame→Logout | **3** |
| **7** | **Tratamento Erros** | Validação 401, 404 | **1** |
| | **TOTAL** | **13 endpoints** | **15 testes ✅** |

## 2. Arquivos de Teste

- `tests/e2e/game.e2e.test.js` (15 testes)
- `tests/e2e/auth.e2e.test.js` (2 testes)

## 3. Casos de Teste Implementados

### Autenticação - auth.e2e.test.js (2 testes)
- ✓ SignUp → Login → Profile → Logout (fluxo completo)
- ✓ SignUp com email duplicado retorna 400

### Autenticação - game.e2e.test.js (1 teste)
- ✓ Login com senha incorreta retorna 401

### Cartas CRUD (5 testes)
- ✓ GET /cards - lista cartas
- ✓ POST /cards - cria carta
- ✓ GET /cards/:id - busca por ID
- ✓ PUT /cards/:id - atualiza
- ✓ DELETE /cards/:id - deleta

### Fluxo Completo E2E (3 testes)
- ✓ Criar usuário → Criar jogo → Acessar estado
- ✓ ID inexistente retorna 404
- ✓ Usuário não autenticado retorna 401

### Outros (4 testes)
- ✓ Listar jogadores
- ✓ Criar jogo autenticado
- ✓ Recuperar histórico pontuação
- ✓ Validação de erros

## 4. Resultados dos Testes

```
Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        6.346 s

✓ game.e2e.test.js: 15 testes ✅
✓ auth.e2e.test.js: 2 testes ✅
✓ Taxa de sucesso: 100%
```

## 5. Problemas Encontrados e Soluções

| Problema | Solução |
|----------|---------|
| Dados compartilhados entre testes | `cleanDatabase()` no `beforeEach()` |
| Tokens JWT não funcionavam | Extrair token de resposta e usar em header Authorization |
| IDs dinâmicos não podiam ser reutilizados | Capturar IDs da resposta antes de usar em testes seguintes |
| Campos de modelo incorretos (value vs action) | Mapear corretamente: color, action, gameId |

## 6. Como Rodar os Testes

```bash
# Rodar apenas game.e2e
npm test -- tests/e2e/game.e2e.test.js

# Rodar apenas auth.e2e
npm test -- tests/e2e/auth.e2e.test.js

# Rodar todos os e2e (17 testes)
npm test -- tests/e2e/

# Com detalhes
npm test -- tests/e2e/ --verbose
```

## 7. Estrutura dos Arquivos de Teste

### game.e2e.test.js
Arquivo principal com 15 testes cobrindo autenticação, CRUD de cartas, gerenciamento de jogadores, fluxos de jogo e tratamento de erros.

### auth.e2e.test.js
Arquivo dedicado a autenticação com 2 testes adicionais.

Cada teste segue o padrão **AAA (Arrange-Act-Assert)**:

```javascript
test('exemplo', async () => {
  // ARRANGE
  const userData = { username: 'test', email: 'test@uno.com', password: 'pass123', name: 'Test', age: 25 };
  
  // ACT
  const res = await request(app).post('/api/signup').send(userData);
  
  // ASSERT
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('message');
});
```

## 8. Setup e Isolamento

```javascript
beforeAll(async () => await setupTestDatabase());  // Uma vez
afterAll(async () => await closeDatabase());       // Uma vez
beforeEach(async () => await cleanDatabase());     // Cada teste
```

Cada teste começa com banco limpo → sem contaminação de dados

## Arquivo Teste

- **Localização:** `tests/e2e/game.e2e.test.js`
- **7 suites de teste**
- **15 testes implementados**
- **Todos passando ✅**

---

