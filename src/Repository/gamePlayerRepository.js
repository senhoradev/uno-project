const gamePlayer = require('../models/GamePlayer');
const Card = require("../models/card");

class GamePlayerRepository{

    async saveGamePlayer(gamePlayer){
        return await gamePlayer.saveGamePlayer(gamePlayer);
    }
    async findGamePlayeById(id){
        return await gamePlayer.findByPk(id);
    }

    async findAllGamePlayes(){
        return await gamePlayer.findAll();
    }

    async updateGamePlayer(gamePlayer){
        const updatedGamePlayer = await gamePlayer.findGamePlayeById(gamePlayer.id);
        if(updatedGamePlayer){
            return await gamePlayer.updateGamePlayer(gamePlayer);
        }
        return null;
    }

    async deleteGamePlayer(id){
        const deleteGamePlayer = await this.findGamePlayeById(id);

        if(!deleteGamePlayer){
            return null;
        }
        return await gamePlayer.destroy({
            where: { id }
        });
    }
}
