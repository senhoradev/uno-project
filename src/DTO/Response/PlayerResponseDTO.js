class PlayerResponseDTO {
    constructor(player) {
        this.username = player.username;
        this.email = player.email;
    }
}

module.exports = PlayerResponseDTO;