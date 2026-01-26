/**
 * @fileoverview DTO para padronização e proteção dos dados do Jogador
 * @module dtos/playerDTO
 */

class PlayerDTO {
  constructor(player) {
    this.id = player.id;
    this.username = player.username;
    this.name = player.name;
    this.email = player.email;
    this.age = player.age;
  }
}

module.exports = PlayerDTO;