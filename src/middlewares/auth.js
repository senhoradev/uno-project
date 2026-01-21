const jwt = require('jsonwebtoken');

/**
 * Middleware para validar o token de acesso (JWT)
 * Pode validar o token tanto nos Headers quanto no corpo da requisição (conforme o seu requisito)
 */
module.exports = (req, res, next) => {
  // Tenta obter o token do Header ou do Body (conforme solicitado no seu JSON de entrada)
  const token = req.headers['authorization']?.split(' ')[1] || req.body.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded; // Adiciona os dados do utilizador (id, username) à requisição
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};