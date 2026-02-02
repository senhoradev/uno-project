# Testes Unitários - UNO API

## Estrutura de Testes

```
tests/
├── unit/
│   ├── player.test.js    # Testes CRUD de Players
│   ├── game.test.js      # Testes CRUD de Games
│   └── card.test.js      # Testes CRUD de Cards
└── setup.js              # Configuração global dos testes
```

## Instalação

Instale as dependências de teste:

```bash
npm install
```

## Executar Testes

### Executar todos os testes
```bash
npm test
```

### Executar testes em modo watch (re-executa ao salvar)
```bash
npm run test:watch
```

### Executar testes com cobertura
```bash
npm run test:coverage
```

## Cobertura de Testes

### 1. Player CRUD (player.test.js)
- ✅ CREATE - Criar novo jogador
  - Criar jogador com sucesso
  - Falhar com email duplicado
  - Falhar sem campos obrigatórios
- ✅ READ - Buscar jogadores
  - Buscar por ID
  - Retornar null para ID inexistente
  - Listar todos os jogadores
- ✅ UPDATE - Atualizar jogador
  - Atualizar informações com sucesso
  - Atualizar campos parciais
- ✅ DELETE - Deletar jogador
  - Deletar com sucesso
  - Retornar 0 para ID inexistente

### 2. Game CRUD (game.test.js)
- ✅ CREATE - Criar novo jogo
  - Criar jogo com sucesso
  - Criar com valores padrão
  - Falhar com nome vazio
  - Falhar com maxPlayers inválido
  - Falhar com status inválido
- ✅ READ - Buscar jogos
  - Buscar por ID
  - Retornar null para ID inexistente
  - Listar todos os jogos
  - Buscar por status
- ✅ UPDATE - Atualizar jogo
  - Atualizar informações com sucesso
  - Atualizar apenas status
  - Falhar com status inválido
- ✅ DELETE - Deletar jogo
  - Deletar com sucesso
  - Retornar 0 para ID inexistente

### 3. Card CRUD (card.test.js)
- ✅ CREATE - Criar nova carta
  - Criar carta com sucesso
  - Criar com diferentes cores
  - Criar com diferentes ações
  - Falhar sem cor
  - Falhar sem ação
  - Falhar sem gameId
- ✅ READ - Buscar cartas
  - Buscar por ID
  - Retornar null para ID inexistente
  - Listar todas as cartas de um jogo
  - Buscar por cor
  - Ordenar por data de criação
- ✅ UPDATE - Atualizar carta
  - Atualizar informações com sucesso
  - Atualizar apenas a cor
- ✅ DELETE - Deletar carta
  - Deletar com sucesso
  - Retornar 0 para ID inexistente
  - Deletar todas as cartas de um jogo

## Tecnologias

- **Jest**: Framework de testes
- **Sequelize**: ORM para testes de banco de dados

## Observações

- Os testes usam um banco de dados em memória ou de teste
- Cada teste é isolado e limpa os dados antes de executar
- Timeout configurado para 30 segundos por teste
