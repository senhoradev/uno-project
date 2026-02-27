/**
 * @fileoverview DTO para padronizar as respostas relacionadas à entidade Game
 * @module DTO/Response/GameResponseDTO
 */
class GameResponseDTO {
    /**
     * Cria uma instância de GameResponseDTO
     * @param {Object} data - Dados do jogo
     * @param {number} data.id - ID do jogo
     * @param {string} data.name - Nome do jogo
     * @param {string} data.status - Status atual (waiting, started, finished)
     * @param {number} data.maxPlayers - Número máximo de jogadores
     * @param {number} data.creatorId - ID do criador
     * @param {Date} data.createdAt - Data de criação
     * @param {Date} data.updatedAt - Data de atualização
     * @param {Array} [data.players] - Lista de jogadores associados
     */
    constructor({ id, name, status, maxPlayers, creatorId, createdAt, updatedAt, players }) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.maxPlayers = maxPlayers;
        this.creatorId = creatorId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        
        if (players) {
            this.players = players.map(p => ({
                id: p.id,
                username: p.username,
                isReady: p.GamePlayer?.isReady || false
            }));
            this.currentPlayers = players.length;
        }
    }

    /**
     * Converte um modelo Sequelize Game em um DTO
     * @param {Object} game - Instância do modelo Game
     * @returns {GameResponseDTO} DTO formatado
     */
    static fromModel(game) {
        return new GameResponseDTO({
            id: game.id,
            name: game.name,
            status: game.status,
            maxPlayers: game.maxPlayers,
            creatorId: game.creatorId,
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
            players: game.Players || game.players
        });
    }

    /**
     * Converte uma lista de modelos Game em uma lista de DTOs
     * @param {Array<Object>} games - Lista de instâncias do modelo Game
     * @returns {Array<GameResponseDTO>} Lista de DTOs
     */
    static fromModelList(games) {
        return games.map(game => GameResponseDTO.fromModel(game));
    }

    /**
     * Formata a resposta para o jogador atual
     * @param {number} gameId - ID do jogo
     * @param {string} currentPlayer - Nome do jogador atual
     * @returns {Object} Objeto formatado com game_id e current_player
     */
    static currentPlayerResponse(gameId, currentPlayer) {
        return {
            game_id: gameId,
            current_player: currentPlayer
        };
    }

    /**
     * Formata a resposta para a carta do topo
     * @param {number} gameId - ID do jogo
     * @param {string} topCard - Carta do topo
     * @returns {Object} Objeto formatado com game_id e top_card
     */
    static topCardResponse(gameId, topCard) {
        return {
            game_id: gameId,
            top_card: topCard
        };
    }

    /**
     * Formata a resposta para as pontuações
     * @param {number} gameId - ID do jogo
     * @param {Object} scores - Mapa de pontuações
     * @returns {Object} Objeto formatado com game_id e scores
     */
    static scoresResponse(gameId, scores) {
        return {
            game_id: gameId,
            scores
        };
    }
}

module.exports = GameResponseDTO;
