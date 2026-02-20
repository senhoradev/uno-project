/**
 * @fileoverview Implementação de Result Monad para controle de efeitos
 * @module utils/Result
 * 
 * Result Monad é um padrão funcional que encapsula operações que podem falhar,
 * tornando o tratamento de erros explícito e composável.
 * 
 * Implementa:
 * - Functor (map): transformação de valores
 * - Monad (flatMap): composição de operações que retornam Result
 */

class Result {
  /**
   * Construtor privado - use Result.success() ou Result.failure()
   * @param {boolean} isSuccess - Indica se é sucesso ou falha
   * @param {*} value - Valor em caso de sucesso
   * @param {*} error - Erro em caso de falha
   */
  constructor(isSuccess, value, error) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
    Object.freeze(this); // Imutabilidade
  }

  /**
   * FUNCTOR: map
   * Transforma o valor interno se for Success, propaga erro se for Failure
   * 
   * Lei da Identidade: result.map(x => x) === result
   * Lei da Composição: result.map(f).map(g) === result.map(x => g(f(x)))
   * 
   * @param {Function} fn - Função de transformação (A => B)
   * @returns {Result} Novo Result com valor transformado
   * 
   * @example
   * const doubled = Result.success(5).map(x => x * 2); // Success(10)
   * const failed = Result.failure('erro').map(x => x * 2); // Failure('erro')
   */
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

  /**
   * MONAD: flatMap (também conhecido como bind ou chain)
   * Permite encadear operações que retornam Result, evitando Result aninhados
   * 
   * Lei da Identidade à Esquerda: Result.success(a).flatMap(f) === f(a)
   * Lei da Identidade à Direita: m.flatMap(Result.success) === m
   * Lei da Associatividade: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))
   * 
   * @param {Function} fn - Função que retorna Result (A => Result<B>)
   * @returns {Result} Result retornado pela função
   * 
   * @example
   * const result = Result.success(5)
   *   .flatMap(x => Result.success(x * 2))
   *   .flatMap(x => Result.success(x + 1)); // Success(11)
   */
  flatMap(fn) {
    if (this.isSuccess) {
      try {
        return fn(this.value);
      } catch (error) {
        return Result.failure(error);
      }
    }
    return this;
  }

  /**
   * Extrai o valor ou retorna um valor padrão
   * @param {*} defaultValue - Valor a retornar se for Failure
   * @returns {*} Valor interno ou defaultValue
   */
  getOrElse(defaultValue) {
    return this.isSuccess ? this.value : defaultValue;
  }

  /**
   * Pattern matching - executa uma função baseada no estado
   * @param {Function} onSuccess - Função a executar se Success
   * @param {Function} onFailure - Função a executar se Failure
   * @returns {*} Resultado da função executada
   */
  fold(onSuccess, onFailure) {
    return this.isSuccess ? onSuccess(this.value) : onFailure(this.error);
  }

  /**
   * Verifica se é Success
   * @returns {boolean}
   */
  isOk() {
    return this.isSuccess;
  }

  /**
   * Verifica se é Failure
   * @returns {boolean}
   */
  isErr() {
    return !this.isSuccess;
  }

  /**
   * Aplica uma função ao erro se for Failure
   * @param {Function} fn - Função de transformação do erro
   * @returns {Result}
   */
  mapError(fn) {
    if (!this.isSuccess) {
      try {
        return Result.failure(fn(this.error));
      } catch (error) {
        return Result.failure(error);
      }
    }
    return this;
  }

  /**
   * Converte para Promise (útil para integração com async/await)
   * @returns {Promise}
   */
  toPromise() {
    return this.isSuccess 
      ? Promise.resolve(this.value) 
      : Promise.reject(this.error);
  }

  /**
   * Cria um Result de sucesso
   * @param {*} value - Valor de sucesso
   * @returns {Result}
   */
  static success(value) {
    return new Result(true, value, null);
  }

  /**
   * Cria um Result de falha
   * @param {*} error - Erro ou mensagem de erro
   * @returns {Result}
   */
  static failure(error) {
    return new Result(false, null, error);
  }

  /**
   * Cria Result a partir de uma Promise
   * @param {Promise} promise
   * @returns {Promise<Result>}
   */
  static async fromPromise(promise) {
    try {
      const value = await promise;
      return Result.success(value);
    } catch (error) {
      return Result.failure(error);
    }
  }

  /**
   * Combina múltiplos Results em um único Result
   * Se todos forem Success, retorna Success com array de valores
   * Se algum for Failure, retorna o primeiro Failure
   * @param {Result[]} results
   * @returns {Result}
   */
  static all(results) {
    const values = [];
    for (const result of results) {
      if (!result.isSuccess) {
        return result;
      }
      values.push(result.value);
    }
    return Result.success(values);
  }
}

module.exports = Result;
