class CreatePlayerRequestDTO {
    constructor({ username, email, password, age, name } = {}) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.age = age;
        this.name = name;

    }

    validate() {
        const errors = [];
        if (!this.username || typeof this.username !== 'string') errors.push('username is required');
        if (!this.email || typeof this.email !== 'string') errors.push('email is required');
        if (!this.password || typeof this.password !== 'string' || this.password.length < 6) errors.push('password must be at least 6 characters');
        return errors;
    }
}

module.exports = CreatePlayerRequestDTO;
