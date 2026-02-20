/**
 * @fileoverview Controller responsável pelo gerenciamento de autenticação (Login/Logout).
 * @module controllers/loginController
 */

const loginService = require('../services/loginService'); 
const PlayerDTO = require('../DTO/Response/PlayerResponseDTO');

/**
 * Realiza a autenticação do usuário.
 * 
 * @param {Object} req - Objeto de requisição do Express.
 * @param {Object} req.body - Corpo da requisição.
 * @param {string} req.body.username - Nome de usuário.
 * @param {string} req.body.password - Senha do usuário.
 * @param {Object} res - Objeto de resposta do Express.
 * @returns {Promise<Object>} Retorna o token JWT em caso de sucesso ou erro 401.
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // O método no seu loginService.js é 'authenticate'
    const result = await loginService.authenticate(username, password);
    
    return res.json(result); 
  } catch (error) {
    console.error("Erro no Login:", error.message);
    return res.status(401).json({
      error: "Invalid credentials"
    });
  }
};

/**
 * Realiza o logout do usuário.
 * 
 * @param {Object} req - Objeto de requisição do Express.
 * @param {Object} res - Objeto de resposta do Express.
 * @returns {Promise<Object>} Retorna mensagem de sucesso.
 */
exports.logout = async (req, res) => {
  return res.json({
    message: "User logged out successfully"
  });
};

/**
 * Recupera o perfil do usuário logado.
 * 
 * @param {Object} req - Objeto de requisição do Express.
 * @param {Object} req.body - Corpo da requisição.
 * @param {string} req.body.access_token - Token JWT para validação.
 * @param {Object} res - Objeto de resposta do Express.
 * @returns {Promise<Object>} Retorna os dados do perfil ou erro 401.
 */
exports.profile = async (req, res) => {
  try {
    const { access_token } = req.body;
    
    // O profile já retorna { username, email } do loginService
    const profile = await loginService.getProfile(access_token);
    
    // OPÇÃO A: Se o DTO for apenas para limpar os dados, use assim:
    const responseData = new PlayerDTO(profile);
    
    // Retorne diretamente o objeto do DTO
    return res.json({
      username: responseData.username,
      email: responseData.email
    });
    
  } catch (error) {
    console.error("Erro no Profile:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};