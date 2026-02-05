class UpdateGameRequestDTO {
    constructor({ title, status, maxPlayers }) {
        this.title = title;
        this.status = status;
        this.maxPlayers = maxPlayers
    }

    validate() {
        const errors = [];
        const validStatuses = ['waiting', 'in_progress', 'finished', 'cancelled'];

        if (this.title !== undefined && this.title.trim() === '') {
            errors.push('Title cannot be empty');
        }

        if (this.status !== undefined && !validStatuses.includes(this.status)) {
            errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
        }

        if (this.maxPlayers !== undefined) {
            if (!Number.isInteger(this.maxPlayers) || this.maxPlayers < 2 || this.maxPlayers > 10) {
                errors.push('Max players must be an integer between 2 and 10');
            }
        }

        return errors;
    }
}

module.exports = UpdateGameRequestDTO;
