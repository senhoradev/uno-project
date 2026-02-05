/**
 * @fileoverview Testes unitários para Result Monad
 * Verifica implementação de Functor e Monad
 */

const Result = require('../../src/utils/Result');

describe('Result Monad', () => {
  describe('Construtores', () => {
    test('Result.success cria um Result bem-sucedido', () => {
      const result = Result.success(42);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(42);
      expect(result.error).toBeNull();
    });

    test('Result.failure cria um Result com erro', () => {
      const result = Result.failure('Erro');
      
      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeNull();
      expect(result.error).toBe('Erro');
    });

    test('Result é imutável', () => {
      const result = Result.success(10);
      
      expect(() => {
        result.value = 20;
      }).toThrow();
    });
  });

  describe('Functor - map', () => {
    test('map transforma valor em Success', () => {
      const result = Result.success(5);
      const doubled = result.map(x => x * 2);
      
      expect(doubled.isSuccess).toBe(true);
      expect(doubled.value).toBe(10);
    });

    test('map propaga Failure sem executar função', () => {
      const result = Result.failure('erro');
      const transformed = result.map(x => x * 2);
      
      expect(transformed.isSuccess).toBe(false);
      expect(transformed.error).toBe('erro');
    });

    test('Lei da Identidade: result.map(x => x) === result', () => {
      const result = Result.success(42);
      const identity = result.map(x => x);
      
      expect(identity.value).toBe(result.value);
      expect(identity.isSuccess).toBe(result.isSuccess);
    });

    test('Lei da Composição: result.map(f).map(g) === result.map(x => g(f(x)))', () => {
      const result = Result.success(5);
      const f = x => x + 1;
      const g = x => x * 2;
      
      const composed1 = result.map(f).map(g);
      const composed2 = result.map(x => g(f(x)));
      
      expect(composed1.value).toBe(composed2.value);
    });

    test('map captura exceções e retorna Failure', () => {
      const result = Result.success(5);
      const withError = result.map(() => {
        throw new Error('Erro na transformação');
      });
      
      expect(withError.isSuccess).toBe(false);
      expect(withError.error.message).toBe('Erro na transformação');
    });
  });

  describe('Monad - flatMap', () => {
    test('flatMap encadeia operações que retornam Result', () => {
      const result = Result.success(5);
      const doubled = result.flatMap(x => Result.success(x * 2));
      
      expect(doubled.isSuccess).toBe(true);
      expect(doubled.value).toBe(10);
    });

    test('flatMap propaga Failure', () => {
      const result = Result.failure('erro inicial');
      const chained = result.flatMap(x => Result.success(x * 2));
      
      expect(chained.isSuccess).toBe(false);
      expect(chained.error).toBe('erro inicial');
    });

    test('flatMap permite retornar Failure no meio da cadeia', () => {
      const result = Result.success(5)
        .flatMap(x => Result.success(x * 2))
        .flatMap(x => Result.failure('Erro no meio'))
        .flatMap(x => Result.success(x + 1));
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Erro no meio');
    });

    test('Lei da Identidade à Esquerda: Result.success(a).flatMap(f) === f(a)', () => {
      const a = 42;
      const f = x => Result.success(x * 2);
      
      const left = Result.success(a).flatMap(f);
      const right = f(a);
      
      expect(left.value).toBe(right.value);
    });

    test('Lei da Identidade à Direita: m.flatMap(Result.success) === m', () => {
      const m = Result.success(42);
      const identity = m.flatMap(x => Result.success(x));
      
      expect(identity.value).toBe(m.value);
    });

    test('Lei da Associatividade', () => {
      const m = Result.success(5);
      const f = x => Result.success(x + 1);
      const g = x => Result.success(x * 2);
      
      const left = m.flatMap(f).flatMap(g);
      const right = m.flatMap(x => f(x).flatMap(g));
      
      expect(left.value).toBe(right.value);
    });

    test('flatMap captura exceções', () => {
      const result = Result.success(5);
      const withError = result.flatMap(() => {
        throw new Error('Erro no flatMap');
      });
      
      expect(withError.isSuccess).toBe(false);
      expect(withError.error.message).toBe('Erro no flatMap');
    });
  });

  describe('Métodos auxiliares', () => {
    test('getOrElse retorna valor se Success', () => {
      const result = Result.success(42);
      expect(result.getOrElse(0)).toBe(42);
    });

    test('getOrElse retorna default se Failure', () => {
      const result = Result.failure('erro');
      expect(result.getOrElse(0)).toBe(0);
    });

    test('fold executa onSuccess para Success', () => {
      const result = Result.success(42);
      const value = result.fold(
        x => x * 2,
        err => 0
      );
      
      expect(value).toBe(84);
    });

    test('fold executa onFailure para Failure', () => {
      const result = Result.failure('erro');
      const value = result.fold(
        x => x * 2,
        err => err.toUpperCase()
      );
      
      expect(value).toBe('ERRO');
    });

    test('isOk retorna true para Success', () => {
      expect(Result.success(1).isOk()).toBe(true);
      expect(Result.failure('erro').isOk()).toBe(false);
    });

    test('isErr retorna true para Failure', () => {
      expect(Result.success(1).isErr()).toBe(false);
      expect(Result.failure('erro').isErr()).toBe(true);
    });

    test('mapError transforma erro em Failure', () => {
      const result = Result.failure('erro');
      const transformed = result.mapError(err => err.toUpperCase());
      
      expect(transformed.error).toBe('ERRO');
    });

    test('mapError não afeta Success', () => {
      const result = Result.success(42);
      const transformed = result.mapError(err => err.toUpperCase());
      
      expect(transformed.value).toBe(42);
    });
  });

  describe('Métodos estáticos avançados', () => {
    test('fromPromise converte Promise resolvida em Success', async () => {
      const promise = Promise.resolve(42);
      const result = await Result.fromPromise(promise);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(42);
    });

    test('fromPromise converte Promise rejeitada em Failure', async () => {
      const promise = Promise.reject(new Error('Erro'));
      const result = await Result.fromPromise(promise);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe('Erro');
    });

    test('all combina múltiplos Success em array', () => {
      const results = [
        Result.success(1),
        Result.success(2),
        Result.success(3)
      ];
      
      const combined = Result.all(results);
      
      expect(combined.isSuccess).toBe(true);
      expect(combined.value).toEqual([1, 2, 3]);
    });

    test('all retorna primeiro Failure se algum falhar', () => {
      const results = [
        Result.success(1),
        Result.failure('erro1'),
        Result.failure('erro2')
      ];
      
      const combined = Result.all(results);
      
      expect(combined.isSuccess).toBe(false);
      expect(combined.error).toBe('erro1');
    });
  });

  describe('Composição complexa (Railway-Oriented Programming)', () => {
    // Funções auxiliares para simular operações
    const validatePositive = (x) => 
      x > 0 ? Result.success(x) : Result.failure('Número deve ser positivo');
    
    const validateEven = (x) => 
      x % 2 === 0 ? Result.success(x) : Result.failure('Número deve ser par');
    
    const double = (x) => Result.success(x * 2);

    test('Pipeline de Success completo', () => {
      const result = Result.success(4)
        .flatMap(validatePositive)
        .flatMap(validateEven)
        .flatMap(double)
        .map(x => x + 1);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(9); // 4 * 2 + 1
    });

    test('Pipeline falha na primeira validação', () => {
      const result = Result.success(-2)
        .flatMap(validatePositive)
        .flatMap(validateEven)
        .flatMap(double);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Número deve ser positivo');
    });

    test('Pipeline falha na segunda validação', () => {
      const result = Result.success(3)
        .flatMap(validatePositive)
        .flatMap(validateEven)
        .flatMap(double);
      
      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('Número deve ser par');
    });
  });

  describe('Integração com async/await', () => {
    const asyncDouble = async (x) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return Result.success(x * 2);
    };

    test('flatMap funciona com funções assíncronas', async () => {
      const result = await Result.success(5).flatMap(asyncDouble);
      
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(10);
    });

    test('toPromise converte Success em Promise resolvida', async () => {
      const result = Result.success(42);
      const value = await result.toPromise();
      
      expect(value).toBe(42);
    });

    test('toPromise converte Failure em Promise rejeitada', async () => {
      const result = Result.failure('erro');
      
      await expect(result.toPromise()).rejects.toBe('erro');
    });
  });
});
