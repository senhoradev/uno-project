class UpdatePlayerRequestDTO {
    constructor({ username, password, name, age, email }) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.age = age;
        this.email = email;
    }

    validate() {
        const errors = [];

        const hasAtLeastOneField =
            this.username !== undefined ||
            this.password !== undefined ||
            this.name !== undefined ||
            this.age !== undefined ||
            this.email !== undefined;

        if (!hasAtLeastOneField) {
            errors.push('At least one field must be provided');
            return errors;
        }

        if (this.username !== undefined) {
            if (typeof this.username !== 'string' || this.username.trim() === '') {
                errors.push('Username must be a non-empty string');
            }
        }

        if (this.password !== undefined) {
            if (typeof this.password !== 'string' || this.password.trim() === '') {
                errors.push('Password must be a non-empty string');
            }
        }

        if (this.name !== undefined) {
            if (typeof this.name !== 'string' || this.name.trim() === '') {
                errors.push('Name must be a non-empty string');
            }
        }

        if (this.age !== undefined) {
            if (typeof this.age !== 'number' || !Number.isInteger(this.age) || this.age <= 0) {
                errors.push('Age must be a positive integer');
            }
        }

        if (this.email !== undefined) {
            if (
                typeof this.email !== 'string' ||
                this.email.trim() === '' ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
            ) {
                errors.push('Email must be a valid email address');
            }
        }

        return errors;
    }
}

module.exports = UpdatePlayerRequestDTO;
