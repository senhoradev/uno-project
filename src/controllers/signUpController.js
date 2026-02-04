/**
 * @fileoverview Controller responsável pelo gerenciamento do registro de usuários.
 * @module controllers/signUpController
 */

const signUpService = require('../services/signUpService');
const CreatePlayerRequestDTO = require('../DTO/Request/Player/CreatePlayerRequestDTO');

/**
 * Registra um novo usuário no sistema.
 * * @param {Object} req - Objeto de requisição do Express.
 * @param {Object} req.body - Corpo da requisição contendo os dados do usuário.
 * @param {Object} res - Objeto de resposta do Express.
 * @returns {Promise<Object>} Retorna uma resposta JSON com status 201 em caso de sucesso ou erro.
 */
exports.register = async (req, res) => {
  try {
    // 1. Instancia o DTO de Request com os dados vindos do corpo da requisição
    // Isso garante que apenas os campos username, email, password, age e name sejam processados
    const signUpData = new CreatePlayerRequestDTO(req.body);

    // 2. Chama o serviço de registro passando o objeto estruturado pelo DTO
    await signUpService.register(signUpData);
    
    // 3. Retorna sucesso conforme o requisito: JSON com a chave "message"
    return res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    // Trata o erro de usuário já existente com status 400
    if (error.message === 'User already exists') {
      return res.status(400).json({
        error: "User already exists"
      });
    }
    
    // Para qualquer outro erro (como o erro 500 do Player.findOne), retorna o status 500
    return res.status(500).json({ error: error.message });
  }
};