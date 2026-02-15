const Player = require('../models/player');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const playerRepository = require('../repository/PlayerRepository');
const PlayerResponseDTO = require('../DTO/Response/PlayerResponseDTO');
const Result = require('../utils/Result');

/**
 * @fileoverview Serviço de gerenciamento de jogadores implementado com Result Monad
 * * Este serviço utiliza o padrão Result Monad para:
 * - Tornar o tratamento de erros explícito e previsível
 * - Facilitar a composição de operações assíncronas (flatMap)
 * - Seguir os princípios de Railway-Oriented Programming (ROP)
 * - Isolar efeitos colaterais e garantir imutabilidade nos resultados
 */
class PlayerService {
  
  /**
   * Valida regras de negócio para a senha usando a lógica de Result
   * @param {string} password - Senha a ser validada
   * @returns {Result} Result.success com a senha ou Result.failure com erro de validação
   */
  validatePassword(password) {
    if (!password || password.length < 6) {
      return Result.failure({
        message: 'A senha deve ter pelo menos 6 caracteres',
        code: 'VALIDATION_ERROR'
      });
    }
    return Result.success(password);
  }

  /**
   * Cria um novo jogador
   * Utiliza validações explícitas antes de prosseguir para a persistência
   * * @param {Object} playerToSave - Dados do jogador (email, password, username)
   * @returns {Promise<Result>} Result.success(PlayerResponseDTO) ou Result.failure
   */
  async createPlayer(playerToSave) {
    const { email, password, username } = playerToSave;

    // 1. Validação de senha: Se falhar, o erro é retornado imediatamente
    const passwordResult = this.validatePassword(password);
    if (passwordResult.isErr()) return passwordResult;

    try {
      // 2. Verificação de existência (Regra de Negócio)
      if (await playerRepository.existsByEmail(email)) {
        return Result.failure({ 
          message: 'User already exists', 
          code: 'CONFLICT' 
        });
      }

      // 3. Processamento de Hash
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 4. Persistência no Repositório
      const savedPlayer = await playerRepository.save({
        ...playerToSave,
        password: hashedPassword
      });

      // Retorna sucesso encapsulando o DTO de resposta
      return Result.success(new PlayerResponseDTO({ username, email }));
    } catch (error) {
      return Result.failure({ 
        message: 'Erro ao criar jogador no banco de dados', 
        details: error.message, 
        code: 'DATABASE_ERROR' 
      });
    }
  }

  /**
   * Autentica um jogador e gera um token JWT
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<Result>} Result com token de acesso ou erro de credenciais
   */
  async login(username, password) {
    try {
      const player = await Player.findOne({ where: { username } });

      // Verificação monádica: evita o uso de múltiplos blocos if/else aninhados
      if (!player || !(await bcrypt.compare(password, player.password))) {
        return Result.failure({ 
          message: 'Invalid credentials', 
          code: 'UNAUTHORIZED' 
        });
      }

      const token = jwt.sign(
        { id: player.id, username: player.username, email: player.email },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '3h' }
      );

      return Result.success({ access_token: token });
    } catch (error) {
      return Result.failure({ 
        message: 'Erro durante o processo de autenticação', 
        details: error.message, 
        code: 'AUTH_ERROR' 
      });
    }
  }

  /**
   * Obtém o perfil do jogador a partir de um token
   * Demonstra o uso de Functor (map) para transformar o valor interno
   * @param {string} token - JWT do jogador
   * @returns {Promise<Result>} Result com dados simplificados do perfil
   */
  async getProfile(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
      
      // Busca o jogador e usa o Functor .map() para transformar o DTO em um objeto de perfil
      const playerResult = await this.getPlayerById(decoded.id);
      
      return playerResult.map(dto => ({
        username: dto.username,
        email: dto.email
      }));
    } catch (error) {
      return Result.failure({ 
        message: 'Invalid token', 
        code: 'UNAUTHORIZED' 
      });
    }
  }

  /**
   * Busca um jogador pelo ID
   * @param {number|string} id 
   * @returns {Promise<Result>} Result.success(PlayerResponseDTO) ou Result.failure(NOT_FOUND)
   */
  async getPlayerById(id) {
    try {
      const player = await playerRepository.findById(id);
      
      if (!player) {
        return Result.failure({ 
          message: 'Jogador não encontrado', 
          id: id, 
          code: 'NOT_FOUND' 
        });
      }
      
      return Result.success(new PlayerResponseDTO(player));
    } catch (error) {
      return Result.failure({ 
        message: 'Erro ao buscar jogador', 
        details: error.message, 
        code: 'DATABASE_ERROR' 
      });
    }
  }

  /**
   * Atualiza dados do jogador usando flatMap (Monad Composition)
   * Demonstra Railway-Oriented Programming: se a busca falhar, a atualização nem é tentada
   * * @param {number|string} id 
   * @param {Object} data - Novos dados do jogador
   * @returns {Promise<Result>} Result com o DTO atualizado
   */
  async updatePlayer(id, data) {
    // 1. Inicia o "trilho" buscando o jogador
    const playerResult = await this.getPlayerById(id);

    // 2. Usa flatMap para encadear a lógica de atualização apenas se o jogador existir
    return playerResult.flatMap(async () => {
      try {
        // Validação opcional de nova senha
        if (data.password) {
          const passValid = this.validatePassword(data.password);
          if (passValid.isErr()) return passValid;
          data.password = await bcrypt.hash(data.password, 10);
        }

        const updated = await playerRepository.update(id, data);
        return Result.success(new PlayerResponseDTO({ username: data.username, email: data.email }));
      } catch (error) {
        return Result.failure({ 
          message: 'Erro ao atualizar dados do jogador', 
          details: error.message, 
          code: 'DATABASE_ERROR' 
        });
      }
    });
  }

  /**
   * Remove um jogador usando composição de Monads
   * @param {number|string} id 
   * @returns {Promise<Result>} Result com mensagem de sucesso ou erro
   */
  async deletePlayer(id) {
    // Composição: Buscar -> Se Sucesso -> Deletar
    const playerResult = await this.getPlayerById(id);

    return playerResult.flatMap(async () => {
      try {
        await playerRepository.deleteById(id);
        return Result.success({ 
          message: 'Jogador removido com sucesso',
          id: id 
        });
      } catch (error) {
        return Result.failure({ 
          message: 'Erro ao remover jogador', 
          details: error.message, 
          code: 'DATABASE_ERROR' 
        });
      }
    });
  }

  // Lista todos os jogadores
  async getAllPlayers() {
    const players = await Player.findAll({
      attributes: ['id', 'username', 'email', 'createdAt']
    });
    return players;
  }

}

module.exports = new PlayerService();