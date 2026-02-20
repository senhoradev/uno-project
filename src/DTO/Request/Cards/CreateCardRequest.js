class CreateGameRequestDTO {
    constructor({ color, action, gameId }) {
        this.color = color;
        this.action = action;
        this.gameId = gameId;
    }
    validate() {
        const errors = [];

        if (typeof this.color !== 'string' || this.color.trim() === '') {
            errors.push('Color is required');
        }

        if (typeof this.action !== 'string' || this.action.trim() === '') {
            errors.push('Action is required');
        }

        if (typeof this.gameId !== 'number' || !Number.isInteger(this.gameId)) {
            errors.push('GameId is required');
        }


        return errors;
    }
}

module.exports = CreateGameRequestDTO;p