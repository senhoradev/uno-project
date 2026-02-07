const Maybe = require('../../src/utils/Maybe');

describe('Monad Maybe', () => {
  
  // Cenário 1: Manipulação de dados válidos
  test('deve aplicar transformações quando o valor existe', () => {
    const result = Maybe.of(10)
      .map(x => x * 2)
      .map(x => x + 5)
      .getOrElse(0);
    
    expect(result).toBe(25);
  });

  // Cenário 2: Tratamento de valores nulos (Propagação de Nothing)
  test('deve interromper o fluxo e retornar o valor padrão se encontrar null', () => {
    const result = Maybe.of(null)
      .map(x => x.toUpperCase()) // Isso quebraria sem o Monad
      .getOrElse('Valor Padrão');
    
    expect(result).toBe('Valor Padrão');
  });

  // Cenário 3: Encadeamento (Chain/FlatMap)
  test('deve permitir encadeamento de funções que retornam outros Monads', () => {
    const half = (val) => (val % 2 === 0 ? Maybe.of(val / 2) : Maybe.of(null));

    const success = Maybe.of(20).chain(half).getOrElse(0);
    const failure = Maybe.of(7).chain(half).getOrElse(0);

    expect(success).toBe(10);
    expect(failure).toBe(0);
  });

  // Cenário 4: Integração com classes do sistema (Pet)
  // Verificando se o SRP é mantido ao processar dados de Pet de forma segura
  test('deve processar o nome de um Pet de forma segura', () => {
    const pet = { name: 'Rex' };
    const nullPet = null;

    const getUpperName = (p) => Maybe.of(p)
      .map(item => item.name)
      .map(name => name.toUpperCase())
      .getOrElse('SEM NOME');

    expect(getUpperName(pet)).toBe('REX');
    expect(getUpperName(nullPet)).toBe('SEM NOME');
  });

  // Cenário 5: Lei da Identidade Direita
  test('deve respeitar a lei da identidade (M.of(x).chain(f) == f(x))', () => {
    const f = x => Maybe.of(x + 1);
    const x = 10;
    
    const lhs = Maybe.of(x).chain(f);
    const rhs = f(x);

    expect(lhs.getOrElse(0)).toBe(rhs.getOrElse(0));
  });
});