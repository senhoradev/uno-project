class GameResponseDTO {
    constructor({ id, title, status, maxPlayers, creatorId, createdAt, updatedAt, players }) {
        this.id = id;
        this.title = title;
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
            title: game.title,
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
}

module.exports = GameResponseDTO;
