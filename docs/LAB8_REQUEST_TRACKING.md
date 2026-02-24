# Lab 8 - Atividade 1 - Sistema de Rastreamento de Requisições

## 📋 Visão Geral

Este documento descreve a implementação completa do sistema de rastreamento de requisições HTTP para o projeto Capstone UNO. O sistema captura métricas de todas as requisições à API e fornece endpoints para análise estatística.

## 🎯 Objetivos Implementados

### ✅ Tarefa 1 - Salvar Requests no Banco de Dados

Implementado um middleware de rastreamento que captura e armazena informações de cada requisição:

- **Endpoint acessado** (`endpointAccess`)
- **Método HTTP** (`requestMethod`)
- **Status code** (`statusCode`)
- **Tempo de resposta** (`responseTime`)
- **Timestamp** (`timestamp`)
- **ID do usuário** (`userId`)

### ✅ Tarefa 2 - Criar 4 Endpoints de Estatísticas

Todos os cálculos são realizados na **camada de serviço** utilizando técnicas de **programação funcional**:

1. **GET /api/stats/requests** - Estatísticas gerais de requisições
2. **GET /api/stats/response-times** - Estatísticas de tempo de resposta
3. **GET /api/stats/status-codes** - Estatísticas de códigos de status HTTP
4. **GET /api/stats/popular-endpoints** - Endpoints mais acessados

## 🏗️ Arquitetura Implementada

```
src/
├── models/
│   └── requestLog.js                 # Modelo Sequelize para logs
├── Repository/
│   └── requestLogRepository.js       # Camada de acesso a dados
├── services/
│   └── requestLogService.js          # Lógica de negócio + estatísticas
├── controllers/
│   └── requestLogController.js       # Controladores HTTP
├── middlewares/
│   └── requestTracking.js            # Middleware de rastreamento
└── routes/
    └── requestLogRoutes.js           # Definição de rotas

tests/unit/
├── requestLogService.test.js         # Testes do serviço
├── requestLogController.test.js      # Testes do controller
└── requestTracking.middleware.test.js # Testes do middleware
```

## 🔧 Componentes Detalhados

### 1. Model - `requestLog.js`

Define a estrutura da tabela `request_logs`:

```javascript
{
  id: INTEGER (PK, auto-increment),
  endpointAccess: STRING,
  requestMethod: STRING,
  statusCode: INTEGER,
  responseTime: INTEGER,
  timestamp: DATE,
  userId: STRING (nullable)
}
```

### 2. Repository - `requestLogRepository.js`

Operações CRUD para logs de requisições:

- `save(data)` - Cria novo log
- `findAll()` - Busca todos os logs
- `findById(id)` - Busca log por ID
- `findByUserId(userId)` - Busca logs de um usuário
- `findByEndpoint(endpoint)` - Busca logs de um endpoint
- `deleteAll()` - Remove todos os logs

### 3. Service - `requestLogService.js`

**Implementações de Programação Funcional:**

#### 🎯 Filter (Filtros)
- Filtragem de requisições bem-sucedidas (2xx)
- Filtragem de requisições com erro (4xx, 5xx)
- Filtragem de requisições autenticadas
- Filtragem de códigos de erro

#### 🔄 Map (Transformação)
- Extração de tempos de resposta
- Transformação de distribuição de status codes
- Cálculo de percentuais
- Formatação de resultados

#### 📊 Reduce (Acumuladores)
- Contagem por método HTTP
- Contagem por status code
- Agrupamento por endpoint
- Agregação de métricas por categoria

#### 💾 Memoization (Cache)
- Cache de estatísticas com TTL de 1 minuto
- Invalidação automática ao criar novos logs
- Otimização de consultas repetidas

#### 🔗 Pipes (Composição)
- Encadeamento de transformações
- Composição de cálculos estatísticos
- Pipeline de processamento de dados

#### 🛡️ Result Monad
- Tratamento explícito de erros
- Composição segura de operações
- Pattern matching com `fold()`

### 4. Middleware - `requestTracking.js`

**Características:**

- ✅ Intercepta `res.json()` e `res.send()`
- ✅ Calcula tempo de resposta automaticamente
- ✅ Extrai userId de usuários autenticados
- ✅ Remove query strings do endpoint
- ✅ Salvamento assíncrono (fire and forget)
- ✅ Não bloqueia a resposta ao cliente
- ✅ Tratamento silencioso de erros

**Fluxo de Execução:**

```
1. Requisição chega
2. Marca tempo de início
3. Intercepta res.json/send
4. Calcula tempo de resposta
5. Salva log assincronamente
6. Retorna resposta ao cliente
```

### 5. Controller - `requestLogController.js`

Implementa os 4 endpoints principais + 2 auxiliares:

#### Endpoints Principais:

**1. GET /api/stats/requests**

Retorna estatísticas gerais:

```json
{
  "success": true,
  "data": {
    "totalRequests": 1000,
    "successfulRequests": 850,
    "failedRequests": 150,
    "successRate": 85.00,
    "failureRate": 15.00,
    "requestsByMethod": {
      "GET": 600,
      "POST": 300,
      "PUT": 50,
      "DELETE": 50
    },
    "authenticatedRequests": 700,
    "unauthenticatedRequests": 300
  }
}
```

**2. GET /api/stats/response-times**

Retorna análise de performance:

```json
{
  "success": true,
  "data": {
    "averageResponseTime": 245.67,
    "minResponseTime": 10,
    "maxResponseTime": 5000,
    "medianResponseTime": 200,
    "p95ResponseTime": 800,
    "p99ResponseTime": 1500,
    "totalRequests": 1000,
    "timeRanges": {
      "fast": 500,
      "medium": 350,
      "slow": 100,
      "verySlow": 50
    }
  }
}
```

**3. GET /api/stats/status-codes**

Retorna distribuição de status HTTP:

```json
{
  "success": true,
  "data": {
    "totalRequests": 1000,
    "statusCodeDistribution": [
      { "statusCode": 200, "count": 700, "percentage": "70.00" },
      { "statusCode": 404, "count": 150, "percentage": "15.00" }
    ],
    "statusCategories": {
      "success": 700,
      "clientError": 200,
      "serverError": 100
    },
    "topStatusCodes": [...],
    "errorCodes": [...],
    "uniqueStatusCodes": 5
  }
}
```

**4. GET /api/stats/popular-endpoints**

Retorna endpoints mais acessados:

```json
{
  "success": true,
  "data": {
    "totalEndpoints": 25,
    "totalRequests": 1000,
    "topEndpoints": [
      {
        "endpoint": "/api/games",
        "totalRequests": 300,
        "percentage": "30.00",
        "methods": { "GET": 200, "POST": 100 },
        "avgResponseTime": 245.5
      }
    ],
    "topEndpointMethods": [...]
  }
}
```

#### Endpoints Auxiliares:

- **GET /api/stats/requests/all** - Lista todos os logs (admin/debug)
- **DELETE /api/stats/requests/all** - Limpa todos os logs (testes)

## 📊 Programação Funcional Implementada

### Técnicas Utilizadas:

#### 1. **Functors (map)**
```javascript
// Extrai tempos de resposta
const responseTimes = logs.map(log => log.responseTime);

// Transforma distribuição
const distribution = Object.entries(counts)
  .map(([code, count]) => ({
    statusCode: parseInt(code),
    count,
    percentage: ((count / total) * 100).toFixed(2)
  }));
```

#### 2. **Filters**
```javascript
// Filtra requisições bem-sucedidas
const successful = logs.filter(log => 
  log.statusCode >= 200 && log.statusCode < 300
);

// Filtra códigos de erro
const errors = distribution.filter(stat => 
  stat.statusCode >= 400
);
```

#### 3. **Reducers (Accumulators)**
```javascript
// Agrupa por método HTTP
const byMethod = logs.reduce((acc, log) => {
  acc[log.requestMethod] = (acc[log.requestMethod] || 0) + 1;
  return acc;
}, {});

// Agrupa por status code
const byStatus = logs.reduce((acc, log) => {
  acc[log.statusCode] = (acc[log.statusCode] || 0) + 1;
  return acc;
}, {});
```

#### 4. **Memoization**
```javascript
memoize(key, fn) {
  if (this.isCacheValid() && statsCache.has(key)) {
    return statsCache.get(key);
  }
  const result = fn();
  statsCache.set(key, result);
  return result;
}
```

#### 5. **Pipes (Composição)**
```javascript
// Pipeline de transformação
const endpointStats = Object.values(endpointCounts)
  .map(endpoint => calculateAverage(endpoint))
  .sort((a, b) => b.totalRequests - a.totalRequests)
  .slice(0, 10);
```

## ✅ Princípios SOLID Aplicados

### 1. **Single Responsibility Principle (SRP)**
- Cada classe/módulo tem uma única responsabilidade
- Repository: acesso a dados
- Service: lógica de negócio
- Controller: tratamento HTTP
- Middleware: rastreamento

### 2. **Open/Closed Principle (OCP)**
- Sistema aberto para extensão (novos endpoints)
- Fechado para modificação (funcionalidade base)

### 3. **Dependency Inversion Principle (DIP)**
- Controller depende de Service (abstração)
- Service depende de Repository (abstração)
- Inversão de dependências facilitada por injeção

## 🧪 Cobertura de Testes

### Testes Implementados:

1. **requestLogService.test.js** (36 testes)
   - Validação de dados
   - Criação de logs
   - Cálculo de estatísticas
   - Memoization
   - Programação funcional

2. **requestLogController.test.js** (25 testes)
   - Todos os 6 endpoints
   - Result Monad
   - Tratamento de erros
   - Códigos HTTP corretos

3. **requestTracking.middleware.test.js** (20 testes)
   - Captura de métricas
   - Interceptação de respostas
   - Cálculo de tempo
   - Extração de userId
   - Fire and forget

**Total: 81 testes unitários**

### Executar Testes:

```bash
# Todos os testes
npm test

# Apenas testes de request log
npm test requestLog

# Com cobertura
npm test -- --coverage
```

## 🚀 Como Usar

### 1. Iniciar o servidor

```bash
npm start
```

### 2. Fazer requisições normalmente

O middleware rastreará automaticamente todas as requisições.

### 3. Consultar estatísticas

```bash
# Estatísticas gerais
curl http://localhost:3000/api/stats/requests

# Tempos de resposta
curl http://localhost:3000/api/stats/response-times

# Status codes
curl http://localhost:3000/api/stats/status-codes

# Endpoints populares
curl http://localhost:3000/api/stats/popular-endpoints
```

## 📝 Postman Collection

Importe a collection atualizada em `docs/postman/UNO_ROUTES.v3.json`.

### Novos endpoints incluídos:

- GET /api/stats/requests
- GET /api/stats/response-times
- GET /api/stats/status-codes
- GET /api/stats/popular-endpoints
- GET /api/stats/requests/all
- DELETE /api/stats/requests/all

## 🔍 Monitoramento e Análise

### Métricas Disponíveis:

1. **Volume de Requisições**
   - Total, sucesso, falhas
   - Por método HTTP
   - Autenticadas vs não-autenticadas

2. **Performance**
   - Tempo médio, mínimo, máximo
   - Mediana, P95, P99
   - Distribuição por faixas

3. **Erros**
   - Status codes de erro
   - Categorias (4xx, 5xx)
   - Distribuição de erros

4. **Popularidade**
   - Endpoints mais acessados
   - Métodos mais usados
   - Tempo médio por endpoint

## 🎓 Conceitos de Programação Funcional Demonstrados

### ✅ Imutabilidade
- Uso de `const` para variáveis
- Spread operator para cópias
- Sem modificação de arrays originais

### ✅ Funções Puras
- Sem side effects
- Mesma entrada = mesma saída
- Cálculos determinísticos

### ✅ Higher-Order Functions
- map, filter, reduce
- Funções que retornam funções
- Composição de funções

### ✅ Memoization
- Cache de resultados
- Otimização de performance
- Invalidação estratégica

### ✅ Monads (Result)
- Tratamento de erros funcional
- Composição segura
- Pattern matching

## 📚 Referências

- [Programação Funcional em JavaScript](https://github.com/MostlyAdequate/mostly-adequate-guide)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)

## 👨‍💻 Autores
Grazielle
Safira
Rhuan
Vitor
Debora

Implementado para Lab 8 - Atividade 1 - JALA University 2026

Árvore de arquivos Gerado por Manus IA

---
