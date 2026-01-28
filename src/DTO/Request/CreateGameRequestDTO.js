class CreateGameRequestDTO {
    constructor({ name, maxPlayers }) {
        this.name = name;
        this.maxPlayers = maxPlayers;
    }

    validate() {
        const errors = [];

        if (!this.name || this.name.trim() === '') {
            errors.push('Name is required');
        }

        if (this.maxPlayers !== undefined) {
            if (!Number.isInteger(this.maxPlayers) || this.maxPlayers < 2 || this.maxPlayers > 10) {
                errors.push('Max players must be an integer between 2 and 10');
            }
        }

        return errors;
    }

    static validate(requestBody) {
        return new CreateGameRequestDTO(requestBody);
    }
}

module.exports = CreateGameRequestDTO;
