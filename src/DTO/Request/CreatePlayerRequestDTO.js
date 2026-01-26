class CreatePlayerRequestDTO {
    constructor({ username, email, password, age, name}) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.age = age;
        this.name = name;
    }
}

module.exports = CreatePlayerRequestDTO;
