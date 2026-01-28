class GameResponseDTO {
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

    static fromModelList(games) {
        return games.map(game => GameResponseDTO.fromModel(game));
    }

    static currentPlayerResponse(gameId, currentPlayer) {
        return {
            game_id: gameId,
            current_player: currentPlayer
        };
    }

    static topCardResponse(gameId, topCard) {
        return {
            game_id: gameId,
            top_card: topCard
        };
    }

    static scoresResponse(gameId, scores) {
        return {
            game_id: gameId,
            scores
        };
    }
}

module.exports = GameResponseDTO;
