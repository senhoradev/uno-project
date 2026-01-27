class CreateGameRequestDTO {
    constructor({ title, maxPlayers }) {
        this.title = title;
        this.maxPlayers = maxPlayers;
    }

    validate() {
        const errors = [];

        if (!this.title || this.title.trim() === '') {
            errors.push('Title is required');
        }

        if (this.maxPlayers !== undefined) {
            if (!Number.isInteger(this.maxPlayers) || this.maxPlayers < 2 || this.maxPlayers > 10) {
                errors.push('Max players must be an integer between 2 and 10');
            }
        }

        return errors;
    }
}

module.exports = CreateGameRequestDTO;
