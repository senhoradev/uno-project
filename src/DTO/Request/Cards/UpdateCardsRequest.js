class UpdateCardsRequest {
    constructor({ color, action, gameId }) {
        this.color = color;
        this.action = action;
        this.gameId = gameId;
    }

    validate() {
        const errors = [];

        const hasAtLeastOne =
            this.color !== undefined ||
            this.action !== undefined ||
            this.gameId !== undefined;

        if (!hasAtLeastOne) {
            errors.push('At least one field must be provided');
            return errors;
        }

        if (this.color !== undefined) {
            if (typeof this.color !== 'string' || this.color.trim() === '') {
                errors.push('Color must be a non-empty string');
            }
        }

        if (this.action !== undefined) {
            if (typeof this.action !== 'string' || this.action.trim() === '') {
                errors.push('Action must be a non-empty string');
            }
        }

        if (this.gameId !== undefined) {
            if (typeof this.gameId !== 'number' || !Number.isInteger(this.gameId)) {
                errors.push('GameId must be an integer');
            }
        }

        return errors;
    }
}
