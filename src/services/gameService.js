/**
 * @fileoverview Serviço responsável pela lógica de negócio dos jogos
 * @module services/gameService
 */

const Game = require('../models/game');
const GamePlayer = require('../models/gamePlayer'); // Importante para gerenciar os participantes
const Player = require('../models/player');

/**
 * Classe de serviço para operações de Game
 * @class GameService
 */
class GameService {
  /**
   * Cria um novo jogo e adiciona o criador automaticamente como primeiro jogador
   * @async
   * @param {Object} data - Dados do jogo (name, rules)
   * @param {number} creatorId - ID do usuário autenticado que está criando o jogo
   * @returns {Promise<Game>} O jogo criado
   */
  async createGame(data, creatorId) {
    const game = await Game.create({
      name: data.name,
      rules: data.rules,
      maxPlayers: data.maxPlayers, // Permite definir o limite de jogadores respeitando as validações do Model
      creatorId: creatorId,
      status: 'waiting' // Jogo começa aguardando jogadores
    });

    // O criador entra automaticamente no jogo e já fica "pronto"
    await GamePlayer.create({ 
      gameId: game.id, 
      playerId: creatorId, 
      isReady: true 
    });

    return game;
  }

  /**
   * Permite que um usuário entre em um jogo existente
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do usuário que deseja entrar
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se o jogo não existir, estiver cheio ou o usuário já estiver nele
   */
  async joinGame(gameId, playerId) {
    const game = await this.getGameById(gameId);

    if (game.status !== 'waiting') {
      throw new Error('Não é possível entrar em um jogo que já iniciou ou finalizou');
    }

    // Verifica se o jogo já atingiu o número máximo de jogadores
    const currentPlayers = await GamePlayer.count({ where: { gameId } });
    if (currentPlayers >= game.maxPlayers) {
      throw new Error('O jogo está cheio');
    }

    // Verifica se o usuário já está no jogo
    const alreadyIn = await GamePlayer.findOne({ 
      where: { gameId, playerId } 
    });
    
    if (alreadyIn) {
      throw new Error('Usuário já está neste jogo');
    }

    // Adiciona o jogador ao jogo
    await GamePlayer.create({ 
      gameId, 
      playerId, 
      isReady: false // Entra mas ainda não confirmou que está pronto
    });

    return true;
  }

  /**
   * Alterna o status de "pronto" de um jogador no jogo
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do jogador
   * @returns {Promise<Object>} Objeto com o novo status de isReady
   * @throws {Error} Se o jogador não estiver no jogo ou o jogo não estiver em espera
   */
  async toggleReady(gameId, playerId) {
    const game = await this.getGameById(gameId);

    // Verifica se o jogo está em fase de espera
    if (game.status !== 'waiting') {
      throw new Error('Não é possível alterar o status de pronto em um jogo que já iniciou ou finalizou');
    }

    // Verifica se o usuário está no jogo
    const gamePlayer = await GamePlayer.findOne({ 
      where: { gameId, playerId } 
    });
    
    if (!gamePlayer) {
      throw new Error('Usuário não está neste jogo');
    }

    // Alterna o status de isReady
    const newReadyStatus = !gamePlayer.isReady;
    await gamePlayer.update({ isReady: newReadyStatus });

    return { 
      isReady: newReadyStatus,
      message: newReadyStatus ? 'Você está pronto!' : 'Você não está mais pronto'
    };
  }

  /**
   * Permite que um usuário abandone um jogo em progresso
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} playerId - ID do usuário que deseja sair
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se o jogo não estiver em andamento ou o usuário não estiver nele
   */
  async leaveGame(gameId, playerId) {
    const game = await this.getGameById(gameId);

    // Verifica se o jogo está em andamento
    if (game.status !== 'in_progress' && game.status !== 'started') {
      throw new Error('O jogo não está em andamento');
    }

    // Verifica se o usuário está no jogo
    const playerInGame = await GamePlayer.findOne({ 
      where: { gameId, playerId } 
    });
    
    if (!playerInGame) {
      throw new Error('Usuário não está neste jogo');
    }

    // Remove o jogador do jogo
    await playerInGame.destroy();

    // Verifica quantos jogadores restam
    const remainingPlayers = await GamePlayer.count({ where: { gameId } });
    
    // Se restar apenas 1 jogador ou nenhum, finaliza o jogo
    if (remainingPlayers <= 1) {
      await game.update({ status: 'finished' });
    }

    return true;
  }

  /**
   * Finaliza um jogo (apenas o criador pode finalizar)
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do usuário que solicita a finalização
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se não for o criador ou se o jogo não estiver em andamento
   */
  async endGame(gameId, userId) {
    const game = await this.getGameById(gameId);

    // Verifica se o usuário é o criador
    if (game.creatorId !== userId) {
      throw new Error('Apenas o criador do jogo pode encerrar a partida');
    }

    // Verifica se o jogo está em andamento
    if (game.status !== 'in_progress' && game.status !== 'started') {
      throw new Error('O jogo não está em andamento');
    }

    // Finaliza o jogo
    await game.update({ status: 'finished' });
    
    return true;
  }

  /**
   * Obtém o estado atual do jogo
   * @async
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Object>} Estado do jogo
   */
  async getGameState(gameId) {
    const game = await this.getGameById(gameId);
    
    return {
      game_id: game.id,
      state: game.status
    };
  }

  /**
   * Obtém a lista de jogadores no jogo
   * @async
   * @param {number} gameId - ID do jogo
   * @returns {Promise<Object>} Lista de jogadores
   */
  async getGamePlayers(gameId) {
    const game = await this.getGameById(gameId);
    
    const gamePlayers = await GamePlayer.findAll({ 
      where: { gameId },
      include: [{
        model: Player,
        attributes: ['id', 'username']
      }]
    });

    const players = gamePlayers.map(gp => gp.Player ? gp.Player.username : `Player${gp.playerId}`);
    
    return {
      game_id: game.id,
      players: players
    };
  }

  /**
   * Inicia o jogo se o solicitante for o criador e todos estiverem prontos
   * @async
   * @param {number} gameId - ID do jogo
   * @param {number} userId - ID do usuário que solicita o início
   * @returns {Promise<boolean>} Sucesso da operação
   * @throws {Error} Se não for o criador ou se houver jogadores não prontos
   */
  async startGame(gameId, userId) {
    const game = await this.getGameById(gameId);

    // 1. Verifica se o usuário é o criador
    if (game.creatorId !== userId) {
      throw new Error('Apenas o criador do jogo pode iniciar a partida');
    }

    // 2. Busca todos os jogadores do jogo
    const players = await GamePlayer.findAll({ where: { gameId } });

    if (players.length < 2) {
      throw new Error('É necessário pelo menos 2 jogadores para iniciar');
    }

    // 3. Verifica se todos estão prontos (isReady === true)
    const allReady = players.every(p => p.isReady === true);
    
    if (!allReady) {
      throw new Error('Nem todos os jogadores estão prontos');
    }

    // 4. Atualiza o status do jogo para iniciado
    await game.update({ status: 'started' });
    
    return true;
  }

  /**
   * Busca um jogo pelo seu ID
   * @async
   * @param {number|string} id - ID do jogo
   * @returns {Promise<Game>} O jogo encontrado
   */
  async getGameById(id) {
    const game = await Game.findByPk(id);
    if (!game) throw new Error('Jogo não encontrado');
    return game;
  }

  /**
   * Atualiza os dados de um jogo existente
   */
  async updateGame(id, data) {
    const game = await this.getGameById(id);

    // Validação: Não permitir diminuir maxPlayers abaixo da quantidade atual de jogadores
    if (data.maxPlayers) {
      const currentPlayersCount = await GamePlayer.count({ where: { gameId: id } });
      if (data.maxPlayers < currentPlayersCount) {
        throw new Error(`Não é possível reduzir o limite para ${data.maxPlayers} pois já existem ${currentPlayersCount} jogadores na partida.`);
      }
    }

    return await game.update(data);
  }

  /**
   * Remove um jogo do banco de dados
   */
  async deleteGame(id) {
    const game = await this.getGameById(id);
    await game.destroy();
    return { message: 'Jogo removido com sucesso' };
  }
}

module.exports = new GameService();