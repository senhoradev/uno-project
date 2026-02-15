const game = require("../models/game");

class gameRepository{


    async saveGame(game){
        return await game.saveGame(game);
    }

    
}