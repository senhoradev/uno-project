/**
 * @fileoverview Controller responsável pelo gerenciamento de autenticação (Login/Logout).
 * @module controllers/loginController
 */

const playerService = require('../services/playerService');

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
    // Chama o serviço de autenticação para verificar credenciais e gerar token
    const result = await playerService.login(username, password);
    return res.json(result);
  } catch (error) {
    // Retorna 401 Unauthorized se as credenciais forem inválidas
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
  // Em JWT o logout é comumente invalidado no cliente (removendo o token), 
  // mas aqui retornamos a confirmação solicitada pela API.
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
    // Decodifica o token para obter informações do usuário
    const profile = await playerService.getProfile(access_token);
    return res.json(profile);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};