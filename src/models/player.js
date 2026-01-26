const { DataTypes } = require('sequelize'); // Importa os tipos de dados do Sequelize para definir os campos do modelo
const sequelize = require('../config/database'); 

// Define o modelo 'Player' da tabela no banco de dados
const Player = sequelize.define('Player', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Este nome de usuário já está em uso.'
    },
    validate: {
      notEmpty: { msg: "O nome de usuário não pode ser vazio." },
      len: { args: [3, 50], msg: "O nome de usuário deve ter entre 3 e 50 caracteres." }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "A senha é obrigatória." }
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "O nome é obrigatório." },
      len: { args: [2, 100], msg: "O nome deve ter entre 2 e 100 caracteres." }
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: { msg: "A idade deve ser um número inteiro." },
      min: { args: [0], msg: "A idade não pode ser negativa." }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      msg: 'Este e-mail já está cadastrado.'
    },
    validate: {
      isEmail: { msg: "Formato de e-mail inválido." },
      notEmpty: { msg: "O e-mail é obrigatório." }
    }
  }
});

module.exports = Player; // Exporta o modelo para ser utilizado nos controllers e services