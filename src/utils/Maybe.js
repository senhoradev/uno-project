/**
 * @fileoverview Implementação da Maybe Monad para tratamento de valores nulos
 * @module utils/Maybe
 */
class Maybe {
  constructor(value) {
    this.__value = value;
    Object.freeze(this); // Garante a imutabilidade
  }

  /**
   * Método estático para criar uma instância de Maybe (Unit/Pure)
   */
  static of(value) {
    return new Maybe(value);
  }

  /**
   * Verifica se o valor é nulo ou indefinido
   */
  isNothing() {
    return this.__value === null || this.__value === undefined;
  }

  /**
   * FUNCTOR: map
   * Aplica uma função ao valor se ele existir
   */
  map(fn) {
    if (this.isNothing()) {
      return Maybe.of(null);
    }
    return Maybe.of(fn(this.__value));
  }

  /**
   * MONAD: chain (também conhecido como flatMap ou bind)
   * Permite encadear funções que retornam outro Maybe
   */
  chain(fn) {
    if (this.isNothing()) {
      return this;
    }
    return fn(this.__value);
  }

  /**
   * Extrai o valor ou retorna um padrão
   */
  getOrElse(defaultValue) {
    if (this.isNothing()) {
      return defaultValue;
    }
    return this.__value;
  }
}

module.exports = Maybe;