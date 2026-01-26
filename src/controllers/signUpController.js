/**
 * @fileoverview Controller responsável pelo gerenciamento do registro de usuários.
 * @module controllers/signUpController
 */

const signUpService = require('../services/signUpService');
const PlayerDTO = require('../dtos/playerDTO');

/**
 * Registra um novo usuário no sistema.
 * 
 * @param {Object} req - Objeto de requisição do Express.
 * @param {Object} req.body - Corpo da requisição contendo os dados do usuário.
 * @param {Object} res - Objeto de resposta do Express.
 * @returns {Promise<Object>} Retorna uma resposta JSON com status 201 em caso de sucesso ou erro.
 */
exports.register = async (req, res) => {
  try {
    // Chama o serviço de registro passando os dados do corpo da requisição
    const newPlayer = await signUpService.register(req.body);
    
    // Retorna sucesso 201 Created se o registro for bem-sucedido
    return res.status(201).json({
      message: "User registered successfully",
      user: new PlayerDTO(newPlayer)
    });
  } catch (error) {
    // Trata o erro específico de usuário já existente
    if (error.message === 'User already exists') {
      return res.status(400).json({
        error: "User already exists"
      });
    }
    // Retorna erro interno do servidor para outros tipos de exceção
    return res.status(500).json({ error: error.message });
  }
};