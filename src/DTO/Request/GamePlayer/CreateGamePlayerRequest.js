class CreateGamePlayerRequestDTO {
    constructor({ gameId, playerId, isReady, isCurrentTurn, score }) {
        this.gameId = gameId;
        this.playerId = playerId;
        this.isReady = isReady;
        this.isCurrentTurn = isCurrentTurn;
        this.score = score;
    }

    validate() {
        const errors = [];

        if (this.gameId === undefined) {
            errors.push('Game ID is required');
        } else if (!Number.isInteger(this.gameId)) {
            errors.push('Game ID must be an integer');
        }

        if (this.playerId === undefined) {
            errors.push('Player ID is required');
        } else if (!Number.isInteger(this.playerId)) {
            errors.push('Player ID must be an integer');
        }

        if (this.isReady !== undefined && typeof this.isReady !== 'boolean') {
            errors.push('isReady must be a boolean');
        }

        if (this.isCurrentTurn !== undefined && typeof this.isCurrentTurn !== 'boolean') {
            errors.push('isCurrentTurn must be a boolean');
        }

        if (this.score !== undefined && !Number.isInteger(this.score)) {
            errors.push('Score must be an integer');
        }
        return errors;


    }



}

module.exports = CreateGamePlayerRequestDTO;
