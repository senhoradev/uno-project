# Distribuição de Cartas - UNO Game

## Funcionalidade Implementada

Sistema de distribuição de cartas para jogadores usando **recursão**, conforme solicitado na Opção 1 do projeto.

## Implementação

### 1. Modelo GamePlayer Atualizado

Foi adicionado o campo `hand` (mão) ao modelo `GamePlayer` para armazenar as cartas de cada jogador:

```javascript
hand: {
  type: DataTypes.JSON,
  defaultValue: [],
  allowNull: false,
  comment: "Armazena as cartas na mão do jogador"
}
```

### 2. Lógica Recursiva

A distribuição de cartas é feita através da função recursiva `dealCardsRecursive`:

- **Caso Base**: Todos os jogadores receberam o número correto de cartas
- **Caso Recursivo**: Distribui uma carta para o jogador atual e chama recursivamente para o próximo jogador
- A recursão percorre os jogadores em rodadas até que cada um tenha o número desejado de cartas

### 3. Baralho UNO Completo

O sistema cria um baralho completo de UNO com 108 cartas:
- **Cartas Numeradas** (0-9) para cada cor (Red, Blue, Green, Yellow)
  - 1x carta "0" por cor
  - 2x cartas "1-9" por cor
- **Cartas de Ação** por cor:
  - 2x Skip
  - 2x Reverse
  - 2x Draw Two
- **Cartas Especiais**:
  - 4x Wild
  - 4x Wild Draw Four

## Como Usar

### Endpoint

```
POST /api/games/deal-cards
```

### Autenticação

Requer token JWT no header:
```
Authorization: Bearer <seu_token>
```

### Request Body

```json
{
  "game_id": 1,
  "cardsPerPlayer": 7
}
```

**Parâmetros:**
- `game_id` (obrigatório): ID do jogo onde as cartas serão distribuídas
- `cardsPerPlayer` (opcional, padrão: 7): Número de cartas que cada jogador receberá

### Response

**Status: 200 OK**

```json
{
  "message": "Cards dealt successfully.",
  "players": {
    "Player1": [
      "Red 3",
      "Blue Skip",
      "Green 7",
      "Yellow Reverse",
      "Wild",
      "Red 9",
      "Blue Draw Two"
    ],
    "Player2": [
      "Yellow 5",
      "Red Skip",
      "Blue 2",
      "Green Draw Two",
      "Wild Draw Four",
      "Red 1",
      "Yellow 8"
    ],
    "Player3": [
      "Green Skip",
      "Wild Draw Four",
      "Red 1",
      "Blue 4",
      "Yellow Reverse",
      "Green 3",
      "Red 7"
    ]
  }
}
```

### Exemplo de Uso com cURL

```bash
curl -X POST http://localhost:3000/api/games/deal-cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "game_id": 1,
    "cardsPerPlayer": 7
  }'
```

### Exemplo de Uso com Postman

1. Método: **POST**
2. URL: `http://localhost:3000/api/games/deal-cards`
3. Headers:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer YOUR_TOKEN_HERE`
4. Body (raw JSON):
```json
{
  "game_id": 1,
  "cardsPerPlayer": 7
}
```

## Erros Possíveis

### 400 - Bad Request

**Jogo não encontrado:**
```json
{
  "error": "Jogo não encontrado"
}
```

**Nenhum jogador no jogo:**
```json
{
  "error": "Nenhum jogador encontrado neste jogo"
}
```

**Cartas insuficientes:**
```json
{
  "error": "Não há cartas suficientes no baralho. Necessário: 21, Disponível: 108"
}
```

**game_id não fornecido:**
```json
{
  "error": "game_id é obrigatório"
}
```

### 401 - Unauthorized

```json
{
  "error": "Token não fornecido" 
}
```

ou

```json
{
  "error": "Token inválido"
}
```

## Fluxo Completo de Uso

1. **Criar um jogo:**
   ```
   POST /api/games
   Body: { "name": "Minha Partida", "maxPlayers": 4 }
   ```

2. **Outros jogadores entram:**
   ```
   POST /api/games/join
   Body: { "game_id": 1 }
   ```

3. **Todos marcam como prontos:**
   ```
   POST /api/games/ready
   Body: { "game_id": 1 }
   ```

4. **Criador inicia o jogo:**
   ```
   POST /api/games/start
   Body: { "game_id": 1 }
   ```

5. **Distribuir cartas (NOVA FUNCIONALIDADE):**
   ```
   POST /api/games/deal-cards
   Body: { "game_id": 1, "cardsPerPlayer": 7 }
   ```

## Observações Técnicas

- O baralho é embaralhado usando o algoritmo **Fisher-Yates** para garantir aleatoriedade
- A distribuição é feita de forma justa, uma carta por vez para cada jogador
- As cartas são armazenadas no campo `hand` de cada registro `GamePlayer` no banco de dados
- A implementação usa **recursão pura** conforme solicitado no requisito
- Suporta qualquer número de jogadores (limitado pela configuração do jogo)
- Suporta qualquer número de cartas por jogador (limitado pelo tamanho do baralho)

## Estrutura dos Arquivos Modificados

- **Modelo**: `src/models/gamePlayer.js` - Adicionado campo `hand`
- **Serviço**: `src/services/gameService.js` - Funções `createUnoDeck()`, `shuffleDeck()`, `dealCardsRecursive()`, `dealCards()`
- **Controller**: `src/controllers/gameController.js` - Função `dealCards()`
- **Rota**: `src/routes/gameRoutes.js` - Rota `POST /deal-cards`
