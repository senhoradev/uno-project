

class UpdateGamePlayerRequestDTO  {
    constructor({ isReady, isCurrentTurn, score }) {

        this.isReady = isReady;
        this.isCurrentTurn = isCurrentTurn;
        this.score = score;
    }

    validate() {
        const errors = [];

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

module.exports = UpdateGamePlayerRequestDTO;
