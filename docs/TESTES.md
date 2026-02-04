# Documentação de Testes Unitários

Este documento descreve os cenários de testes implementados para validar as operações de banco de dados do projeto UNO. Os testes utilizam um banco de dados de memória ou de teste, garantindo que as operações não afetem os dados de produção.

## 1. Testes de Cartas (card.test.js)

Este arquivo valida todas as operações relacionadas à entidade Card (Cartas do jogo).

**Cenários de Criação (CREATE):**
* **Criação com sucesso:** Verifica se uma carta é criada corretamente com cor, ação e ID do jogo vinculados.
* **Variação de cores:** Valida a criação de cartas iterando sobre todas as cores permitidas (red, blue, green, yellow).
* **Variação de ações:** Valida a criação de cartas com diferentes ações especiais (skip, reverse, draw_two, etc.).
* **Validação de campos obrigatórios:**
    * Impede a criação de carta sem cor definida.
    * Impede a criação de carta sem ação definida.
    * Impede a criação de carta sem estar vinculada a um jogo (gameId).

**Cenários de Leitura (READ):**
* **Busca por ID:** Verifica se é possível recuperar os dados corretos de uma carta específica.
* **Tratamento de erro:** Garante que o retorno é nulo ao buscar um ID inexistente.
* **Listagem por jogo:** Valida se o sistema retorna todas as cartas pertencentes a um ID de jogo específico.
* **Filtros:** Testa a busca de cartas filtrando por cor específica dentro de um jogo.
* **Ordenação:** Verifica se a listagem obedece à ordem de criação (timestamp).

**Cenários de Atualização (UPDATE):**
* **Atualização completa:** Testa a alteração simultânea de cor e ação de uma carta.
* **Atualização parcial:** Verifica se é possível alterar apenas um campo (ex: cor) mantendo os outros dados inalterados.

**Cenários de Remoção (DELETE):**
* **Remoção unitária:** Confirma se uma carta é removida do banco de dados pelo ID.
* **Remoção em massa:** Testa a exclusão de todas as cartas vinculadas a um jogo específico (limpeza de mesa).
* **Resiliência:** Verifica o comportamento do sistema ao tentar deletar um registro que não existe.

---

## 2. Testes de Jogo (game.test.js)

Este arquivo foca na lógica de gerenciamento de partidas e salas de jogo.

**Cenários de Criação (CREATE):**
* **Criação completa:** Valida a criação de um jogo com nome, regras, limite de jogadores e criador definidos.
* **Valores padrão:** Verifica se o sistema atribui corretamente os valores padrão (ex: status 'waiting' e limite de 4 jogadores) quando não informados.
* **Validação de dados:**
    * Impede criação de jogo com nome vazio.
    * Impede criação de jogo com número de jogadores acima do limite permitido (ex: 15 jogadores).
    * Impede criação de jogo com status inicial inválido.

**Cenários de Leitura (READ):**
* **Busca simples:** Recupera os detalhes de uma partida pelo seu ID.
* **Listagem geral:** Retorna todos os jogos cadastrados no sistema.
* **Filtro por status:** Valida a busca de jogos que estão em um estado específico (ex: listar apenas jogos 'waiting' ou 'started').

**Cenários de Atualização (UPDATE):**
* **Alteração de regras:** Testa a atualização de nome, limite de jogadores e status da partida.
* **Transição de status:** Verifica a mudança de estado do jogo (ex: de 'waiting' para 'finished').
* **Validação de status:** Garante que o sistema rejeite atualizações para status que não existem na regra de negócio.

**Cenários de Remoção (DELETE):**
* **Exclusão:** Remove uma partida do sistema e verifica se ela não é mais retornada nas buscas.

---

## 3. Testes de Jogador (player.test.js)

Este arquivo garante a integridade dos dados dos usuários/jogadores.

**Cenários de Criação (CREATE):**
* **Registro de usuário:** Valida o cadastro de um novo jogador com username, email, senha, nome e idade.
* **Unicidade de E-mail:** Tenta criar dois jogadores diferentes com o mesmo endereço de e-mail para garantir que o sistema bloqueie a duplicidade.
* **Campos obrigatórios:** Tenta criar um jogador faltando dados essenciais para validar as restrições do banco.

**Cenários de Leitura (READ):**
* **Perfil do usuário:** Busca os dados de um jogador específico pelo ID.
* **Usuário inexistente:** Valida o retorno nulo para buscas de IDs inválidos.
* **Listagem:** Recupera a lista completa de jogadores cadastrados.

**Cenários de Atualização (UPDATE):**
* **Edição de perfil:** Testa a atualização de dados cadastrais (nome, idade).
* **Imutabilidade:** Verifica se campos que não foram enviados na requisição de atualização permanecem com seus valores originais.

**Cenários de Remoção (DELETE):**
* **Exclusão de conta:** Remove o registro de um jogador e confirma a exclusão.