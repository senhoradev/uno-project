/**
 * @fileoverview DTO para padronização dos dados do Jogo
 * @module dtos/gameDTO
 */

class GameDTO {
  constructor(game) {
    this.id = game.id;
    this.name = game.name;
    this.rules = game.rules;
    this.status = game.status;
    this.maxPlayers = game.maxPlayers;
    this.creatorId = game.creatorId;
    this.createdAt = game.createdAt;
    this.updatedAt = game.updatedAt;
  }
}

module.exports = GameDTO;